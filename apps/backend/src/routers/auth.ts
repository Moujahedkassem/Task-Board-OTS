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
      const code = crypto.randomBytes(3).toString('hex');
      // Save the code to the user in the DB (if user exists)
      await prisma.user.updateMany({
        where: { email: input.email },
        data: {
          resetToken: code,
        },
      });
      // Log for dev
      console.log(`Password reset code for ${input.email}: ${code}`);
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
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: input.email,
          subject: 'Password Reset Code',
          text: `Your password reset code is: ${code}`,
          html: `<p>Your password reset code is: <b>${code}</b></p>`,
        });
      } catch (err) {
        console.error('Failed to send reset email:', err);
        // Don't reveal to the user if the email failed for privacy
      }
      return { success: true };
    }),
  resetPassword: publicProcedure
    .input(z.object({
      code: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      // Find user by code
      const user = await prisma.user.findFirst({
        where: {
          resetToken: input.code,
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
}); 