import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { trpc } from '../trpc';

const Auth: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const resetMutation = trpc.auth.requestPasswordReset.useMutation();

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

  // Password reset form submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    try {
      await resetMutation.mutateAsync({ email: resetEmail });
      setResetMessage('If an account exists for this email, a reset link has been sent.');
    } catch (err: any) {
      setResetMessage('Failed to send reset email.');
    }
  };

  if (showResetForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Reset Password</h2>
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              name="resetEmail"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className="border rounded px-3 py-2"
              autoComplete="email"
              required
              disabled={resetMutation.isPending}
            />
            {resetMessage && (
              <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2">{resetMessage}</div>
            )}
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 transition disabled:opacity-50"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              className="text-blue-500 underline text-sm mt-2"
              onClick={() => { setShowResetForm(false); setResetMessage(''); }}
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