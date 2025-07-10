import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function signJwt(user: { id: string; email: string; name: string }) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email },
        });
        if (existingUser) {
          // Throw a tRPC error with a custom message
          throw new Error('EMAIL_IN_USE');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: input.email,
            name: input.name,
            // Add password field to your Prisma schema if not present!
            password: hashedPassword,
          },
        });

        const token = signJwt(user);
        return { success: true, user: { id: user.id, email: user.email, name: user.name }, token };
      } catch (err: any) {
        // Catch Prisma unique constraint error
        if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new Error('EMAIL_IN_USE');
        }
        // Log and rethrow other errors
        console.error('Register mutation error:', err);
        throw err;
      }
    }),
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      console.log('Login mutation called with:', input); // Log login attempts
      try {
        const user = await prisma.user.findUnique({ where: { email: input.email } });
        console.log('Login attempt user:', user); // Debug log
        if (!user) {
          throw new Error('INVALID_CREDENTIALS');
        }
        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) {
          throw new Error('INVALID_CREDENTIALS');
        }
        // Always return the user object on success
        const token = signJwt(user);
        return { success: true, user: { id: user.id, email: user.email, name: user.name }, token };
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
          throw new Error('INVALID_CREDENTIALS');
        }
        console.error('Login mutation error:', err);
        throw err;
      }
    }),
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // Generate a reset code
      const code = crypto.randomBytes(3).toString('hex').toUpperCase();
      
      console.log('=== PASSWORD RESET DEBUG ===');
      console.log('Email:', input.email);
      console.log('Generated code:', code);
      console.log('SMTP Config:', {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: Number(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER || 'user@example.com',
        from: process.env.SMTP_FROM || 'no-reply@example.com'
      });
      
      // Check if user exists first
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });
      
      if (!existingUser) {
        console.log('User does not exist:', input.email);
        return { success: true, message: 'If an account exists for this email, a reset code has been sent.' };
      }
      
      console.log('User exists, updating reset token...');
      
      // Save the code to the user in the DB
      const updateResult = await prisma.user.update({
        where: { email: input.email },
        data: {
          resetToken: code,
        },
      });
      console.log('Database update result:', updateResult);
      
      // Create transporter INSIDE the mutation
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'user@example.com',
          pass: process.env.SMTP_PASS || 'password',
        },
      });
      
      // Send code in email
      try {
        console.log('Attempting to send email...');
        const emailResult = await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: input.email,
          subject: 'Password Reset Code',
          text: `Your password reset code is: ${code}`,
          html: `<p>Your password reset code is: <b>${code}</b></p>`,
        });
        console.log('Email sent successfully:', emailResult);
        return { success: true, code, message: 'Reset code sent successfully!' };
      } catch (err: any) {
        console.error('=== EMAIL SENDING FAILED ===');
        console.error('Error details:', err);
        console.error('SMTP Error code:', err.code);
        console.error('SMTP Error command:', err.command);
        console.error('SMTP Error response:', err.response);
        // Don't reveal to the user if the email failed for privacy
        return { success: true, message: 'If an account exists for this email, a reset code has been sent.' };
      }
      
      console.log('=== END PASSWORD RESET DEBUG ===');
    }),
  verifyResetCode: publicProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Find user by code (case-insensitive)
      const user = await prisma.user.findFirst({
        where: {
          resetToken: {
            equals: input.code,
            mode: 'insensitive'
          },
        },
      });
      if (!user) {
        throw new Error('Invalid or expired code');
      }
      return { success: true };
    }),
  resetPassword: publicProcedure
    .input(z.object({
      code: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      // Find user by code (case-insensitive)
      const user = await prisma.user.findFirst({
        where: {
          resetToken: {
            equals: input.code,
            mode: 'insensitive'
          },
        },
      });
      if (!user) {
        throw new Error('Invalid or expired code');
      }
      // Update password and clear code
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(input.newPassword, 10),
          resetToken: null,
        },
      });
      return { success: true };
    }),
  testEmailConfig: publicProcedure
    .mutation(async () => {
      console.log('=== EMAIL CONFIG TEST ===');
      console.log('SMTP_HOST:', process.env.SMTP_HOST);
      console.log('SMTP_PORT:', process.env.SMTP_PORT);
      console.log('SMTP_USER:', process.env.SMTP_USER);
      console.log('SMTP_FROM:', process.env.SMTP_FROM);
      console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : '***NOT SET***');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'user@example.com',
          pass: process.env.SMTP_PASS || 'password',
        },
      });
      
      try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
        return { success: true, message: 'SMTP configuration is valid' };
      } catch (err: any) {
        console.error('SMTP verification failed:', err);
        return { success: false, error: err.message };
      }
    }),
  checkUser: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true, name: true, resetToken: true }
      });
      
      console.log('=== USER CHECK ===');
      console.log('Email:', input.email);
      console.log('User exists:', !!user);
      if (user) {
        console.log('User details:', user);
      }
      
      return { 
        exists: !!user, 
        user: user ? { id: user.id, email: user.email, name: user.name } : null 
      };
    }),
}); 