import React from "react";
import type { Task } from "../types/task";
import { useUsers } from "../context/UserContext";

interface TaskCardProps {
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function TaskCard({ task, onEdit, onDelete, dragHandleProps }: TaskCardProps) {
  const { users } = useUsers();
  const assignee = task.assigneeId ? users.find(u => u.id === task.assigneeId) : undefined;

  return (
    <div className="bg-blue-100 border border-blue-300 rounded p-3 shadow-sm w-full relative flex flex-col transition-all duration-500">
      <div className="flex items-center mb-1 gap-2">
        {dragHandleProps && (
          <span
            {...dragHandleProps}
            className="cursor-grab mr-2 text-gray-400 hover:text-blue-500 select-none"
            title="Drag"
            aria-label="Drag handle"
          >
            ≡
          </span>
        )}
        {assignee ? (
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold shadow"
            title={assignee.name}
          >
            {getInitials(assignee.name)}
          </span>
        ) : (
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 text-gray-500 text-xs font-bold shadow"
            title="Unassigned"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" fill="currentColor"/></svg>
          </span>
        )}
        <h3 className="font-semibold flex-1">{task.title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
      {assignee && (
        <div className="text-xs text-blue-700 font-medium mb-1">Assigned to: {assignee.name}</div>
      )}
      <div className="flex gap-2 absolute top-2 right-2">
        {onEdit && (
          <button
            className="text-xs px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
            onClick={e => { e.stopPropagation(); onEdit && onEdit(); }}
            aria-label="Edit"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={e => { e.stopPropagation(); onDelete && onDelete(); }}
            aria-label="Delete"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
} 