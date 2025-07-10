import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Auth: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, requestPasswordReset, verifyResetCode, resetPassword, clearResetState } = useAuth();
  
  // Reset password states
  const [showResetForm, setShowResetForm] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', tab, form);
    setError('');
    setLoading(true);
    if (!form.email || !form.password || (tab === 'register' && !form.name)) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      setLoading(false);
      navigate("/");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication failed.');
    }
  };

  // Step 1: Request password reset
  const handleResetEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    try {
      await requestPasswordReset(resetEmailInput);
      setResetMessage('Reset code sent! Check your email and enter the 6-character code below.');
      setShowCodeInput(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset code.');
    }
  };

  // Step 2: Verify reset code
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!resetCodeInput || resetCodeInput.length !== 6) {
      setResetError('Please enter a 6-character code.');
      return;
    }
    try {
      await verifyResetCode(resetCodeInput);
      setShowNewPasswordForm(true);
      setResetMessage('');
    } catch (err: any) {
      setResetError(err.message || 'Invalid reset code.');
    }
  };

  // Step 3: Set new password
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    try {
      await resetPassword(resetCodeInput, newPassword);
      setResetMessage('Password reset successful! You can now log in.');
      setTimeout(() => {
        clearResetState();
        setShowResetForm(false);
        setShowCodeInput(false);
        setShowNewPasswordForm(false);
        setResetEmailInput('');
        setResetCodeInput('');
        setNewPassword('');
        setConfirmPassword('');
        setResetMessage('');
        setResetError('');
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    }
  };

  const handleBackToLogin = () => {
    clearResetState();
    setShowResetForm(false);
    setShowCodeInput(false);
    setShowNewPasswordForm(false);
    setResetEmailInput('');
    setResetCodeInput('');
    setNewPassword('');
    setConfirmPassword('');
    setResetMessage('');
    setResetError('');
  };

  // Show new password form
  if (showNewPasswordForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Set New Password</h2>
          <form onSubmit={handleNewPasswordSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="border rounded px-3 py-2"
              autoComplete="new-password"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="border rounded px-3 py-2"
              autoComplete="new-password"
              required
            />
            {resetError && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{resetError}</div>
            )}
            {resetMessage && (
              <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded px-3 py-2">{resetMessage}</div>
            )}
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              Reset Password
            </button>
            <button
              type="button"
              className="text-blue-500 underline text-sm mt-2"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show code input form
  if (showCodeInput) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Enter Reset Code</h2>
          <p className="text-sm text-gray-600 mb-4">Enter the 6-character code sent to your email</p>
          
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter 6-character code"
              value={resetCodeInput}
              onChange={e => setResetCodeInput(e.target.value.toUpperCase())}
              className="border rounded px-3 py-2 text-center text-lg font-mono tracking-widest"
              maxLength={6}
              autoComplete="off"
              required
            />
            {resetError && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{resetError}</div>
            )}
            {resetMessage && (
              <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2">{resetMessage}</div>
            )}
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              Verify Code
            </button>
            <button
              type="button"
              className="text-blue-500 underline text-sm mt-2"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show reset email form
  if (showResetForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Reset Password</h2>
          <form onSubmit={handleResetEmailSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmailInput}
              onChange={e => setResetEmailInput(e.target.value)}
              className="border rounded px-3 py-2"
              autoComplete="email"
              required
            />
            {resetError && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{resetError}</div>
            )}
            {resetMessage && (
              <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2">{resetMessage}</div>
            )}
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              Send Reset Code
            </button>
            <button
              type="button"
              className="text-blue-500 underline text-sm mt-2"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 font-semibold rounded-l ${tab === 'login' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setTab('login')}
            type="button"
            disabled={loading}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 font-semibold rounded-r ${tab === 'register' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setTab('register')}
            type="button"
            disabled={loading}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === 'register' && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className="border rounded px-3 py-2"
              autoComplete="name"
              disabled={loading}
            />
          )}
          {/* Error message above email field */}
          {tab === 'register' && error && error.toLowerCase().includes('email') && (
            <div className="flex items-center gap-2 border border-red-300 bg-red-50 text-red-700 text-sm rounded px-3 py-2 animate-shake mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span>{error}</span>
            </div>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className={`border rounded px-3 py-2 ${tab === 'register' && error && error.toLowerCase().includes('email') ? 'border-red-500 bg-red-50' : ''}`}
            autoComplete="email"
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            disabled={loading}
          />
          {/* Show error message only once above the button for login */}
          {error && (
            <div className="flex items-center gap-2 border border-red-300 bg-red-50 text-red-700 text-sm rounded px-3 py-2 animate-shake mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (tab === 'login' ? 'Logging in...' : 'Registering...') : (tab === 'login' ? 'Login' : 'Register')}
          </button>
          {tab === 'login' && (
            <button
              type="button"
              className="text-blue-500 underline text-sm mt-2"
              onClick={() => setShowResetForm(true)}
            >
              Forgot Password?
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth; 