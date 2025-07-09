import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "../trpc";
import type { Task, TaskStatus } from "../types/task";
import type { TaskFilterValues } from "../components/TaskFilters";
import { io as socketIOClient, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: unknown;
  filters: TaskFilterValues;
  setFilters: (filters: TaskFilterValues) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  onlineUsers: string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const defaultFilters: TaskFilterValues = { search: "", assigneeId: "", from: "", to: "" };

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<TaskFilterValues>(defaultFilters);
  const debouncedFilters = useDebouncedValue(filters, 300);
  const { data, refetch, isLoading, error } = trpc.task.getAll.useQuery(debouncedFilters);
  const createTask = trpc.task.create.useMutation();
  const updateTask = trpc.task.update.useMutation();
  const deleteTask = trpc.task.delete.useMutation();
  const { getToken } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync local tasks state with server data
  useEffect(() => {
    if (data) setTasks(data);
  }, [data]);

  useEffect(() => {
    const token = getToken?.();
    const socket: Socket = socketIOClient("http://localhost:4000", {
      auth: token ? { token } : undefined,
    });
    const handleRealtime = () => {
      refetch().then(res => {
        if (res.data) setTasks(res.data);
      });
    };
    socket.on("task:created", (payload) => {
      window.dispatchEvent(new CustomEvent("task:created", { detail: payload }));
      handleRealtime();
    });
    socket.on("task:updated", (payload) => {
      window.dispatchEvent(new CustomEvent("task:updated", { detail: payload }));
      handleRealtime();
    });
    socket.on("task:deleted", (payload) => {
      window.dispatchEvent(new CustomEvent("task:deleted", { detail: payload }));
      handleRealtime();
    });
    socket.on("online-users", (userIds: string[]) => {
      setOnlineUsers(userIds);
    });
    return () => {
      socket.disconnect();
    };
  }, [refetch, getToken]);

  // Optimistic create
  const addTask = (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const tempId = "temp-" + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const optimisticTask: Task = { ...task, id: tempId, createdAt: now, updatedAt: now } as Task;
    setTasks(prev => [optimisticTask, ...prev]);
    // Convert assigneeId null to undefined for backend
    const backendTask = { ...task, assigneeId: task.assigneeId ?? undefined };
    createTask.mutate(backendTask, {
      onSuccess: (newTask: Task) => {
        setTasks((prev: Task[]) => prev.map((t: Task) => t.id === tempId ? newTask : t));
      },
      onError: () => {
        setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== tempId));
        setErrorMsg("Failed to create task");
      }
    });
  };

  // Optimistic update
  const editTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev: Task[]) => {
      const oldTask = prev.find((t: Task) => t.id === id);
      if (!oldTask) return prev;
      const updatedTask = { ...oldTask, ...updates };
      return prev.map((t: Task) => t.id === id ? updatedTask : t);
    });
    const oldTask = tasks.find((t: Task) => t.id === id);
    // Ensure all required fields are present and assigneeId is string or undefined
    const backendUpdates = {
      id,
      title: updates.title ?? oldTask?.title ?? "",
      description: updates.description ?? oldTask?.description ?? "",
      status: updates.status ?? oldTask?.status ?? "TODO",
      assigneeId: (updates.assigneeId ?? oldTask?.assigneeId) ?? undefined,
    };
    updateTask.mutate(backendUpdates, {
      onSuccess: (updated: Task) => {
        setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? updated : t));
      },
      onError: () => {
        setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? (oldTask || t) : t));
        setErrorMsg("Failed to update task");
      }
    });
  };

  // Optimistic delete
  const deleteTaskFn = (id: string) => {
    const deletedTask = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteTask.mutate(id, {
      onError: () => {
        setTasks(prev => deletedTask ? [deletedTask, ...prev] : prev);
        setErrorMsg("Failed to delete task");
      }
    });
  };

  const moveTask = (id: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      editTask(id, {
        title: task.title,
        description: task.description,
        status,
        assigneeId: task.assigneeId ?? undefined,
      });
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, loading: isLoading, error, filters, setFilters, moveTask, addTask, editTask, deleteTask: deleteTaskFn, onlineUsers }}>
      {errorMsg && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow z-50">{errorMsg}</div>}
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within a TaskProvider");
  return ctx;
}; 