import { useEffect } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold transition-all animate-fade-in-up ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
} 