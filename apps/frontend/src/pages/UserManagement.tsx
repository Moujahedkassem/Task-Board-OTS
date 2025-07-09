import React, { useState } from "react";
import { trpc } from "../trpc";
import { useUsers } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function UserManagement() {
  const { users, loading, error } = useUsers();
  const utils = trpc.useUtils();
  const createUser = trpc.user.create.useMutation({ onSuccess: () => utils.user.getAll.invalidate() });
  const updateUser = trpc.user.update.useMutation({ onSuccess: () => utils.user.getAll.invalidate() });
  const deleteUser = trpc.user.delete.useMutation({ onSuccess: () => utils.user.getAll.invalidate() });

  const [form, setForm] = useState({ id: "", name: "", email: "", password: "" });
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  const handleEdit = (user: any) => {
    setForm({ id: user.id, name: user.name, email: user.email, password: "" });
    setEditing(true);
    setFormError("");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.email || (!editing && !form.password)) {
      setFormError("Name, email, and password are required.");
      return;
    }
    if (editing) {
      updateUser.mutate({ id: form.id, name: form.name, email: form.email });
    } else {
      createUser.mutate({ name: form.name, email: form.email, password: form.password });
    }
    setForm({ id: "", name: "", email: "", password: "" });
    setEditing(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
          onClick={() => navigate("/")}
        >
          Back to Board
        </button>
      </div>
      {loading ? (
        <div className="text-gray-400">Loading users...</div>
      ) : error ? (
        <div className="text-red-500">Error loading users.</div>
      ) : (
        <table className="w-full mb-6 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2 flex gap-2">
                  <button className="text-xs px-2 py-1 bg-yellow-400 text-white rounded" onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button className="text-xs px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(user.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">{editing ? "Edit User" : "Add User"}</h2>
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        {!editing && (
          <input
            className="border p-2 rounded"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          />
        )}
        {formError && <div className="text-red-500 text-sm">{formError}</div>}
        <div className="flex gap-2 mt-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button type="button" className="bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={() => { setEditing(false); setForm({ id: "", name: "", email: "", password: "" }); }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 