import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { trpc } from "../trpc";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const resetMutation = trpc.auth.resetPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!token) {
      setError("Invalid or missing token.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await resetMutation.mutateAsync({ code: token, newPassword: password });
      setMessage("Password reset successful! You can now log in.");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err: any) {
      setError("Failed to reset password. The link may be invalid or expired.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded px-3 py-2"
            autoComplete="new-password"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="border rounded px-3 py-2"
            autoComplete="new-password"
            required
          />
          {error && (
            <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
          )}
          {message && (
            <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded px-3 py-2">{message}</div>
          )}
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 