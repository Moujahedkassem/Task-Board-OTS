import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold">
          {getInitials(user.name)}
        </span>
        <span className="hidden sm:inline">{user.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">{user.email}</div>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b"
            onClick={() => { logout(); setOpen(false); }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 