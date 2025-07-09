import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import TaskDialog from "../components/TaskDialog";
import type { TaskStatus } from "../types/task";
import TeamMembers from "../components/TeamMembers";
import TaskFilters from "../components/TaskFilters";
import type { TaskFilterValues } from "../components/TaskFilters";
import { Button } from "../components/ui/button";
import { Toast } from "../components/ui/toast";
import ProfileMenu from "../components/ProfileMenu";
import { useEffect, useState } from "react";

const columns = [
  { key: "TODO", title: "To Do" },
  { key: "IN_PROGRESS", title: "In Progress" },
  { key: "DONE", title: "Done" },
];

function DraggableTask({ task, onEdit, onDelete }: { task: any; onEdit?: () => void; onDelete?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        width: "100%",
      }}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function DroppableColumn({ colKey, children }: { colKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 bg-white rounded shadow p-4 transition-colors ${isOver ? "bg-blue-50" : ""}`}
      id={colKey}
    >
      {children}
    </div>
  );
}

export default function KanbanBoard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tasks, moveTask, addTask, editTask, deleteTask, loading, error, filters, setFilters } = useTasks();
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editTaskData, setEditTaskData] = React.useState<any>(null);
  const [toast, setToast] = React.useState<{ message: string; type?: "success" | "error" } | null>(null);
  const [realtimeMsg, setRealtimeMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  useEffect(() => {
    const handleEvent = (payload: any) => {
      if (!payload || !payload.task || !payload.user) return;
      const { user, task, action } = payload;
      let msg = "";
      if (action === "created") msg = `${user.name} added '${task.title}'`;
      else if (action === "updated") msg = `${user.name} updated '${task.title}'`;
      else if (action === "deleted") msg = `${user.name} deleted '${task.title}'`;
      setRealtimeMsg(msg);
      setTimeout(() => setRealtimeMsg(null), 4000);
    };
    // Listen to Socket.IO events via window (TaskContext handles socket connection)
    // We'll use a custom event dispatched from TaskContext
    window.addEventListener("task:created", (e: any) => handleEvent(e.detail));
    window.addEventListener("task:updated", (e: any) => handleEvent(e.detail));
    window.addEventListener("task:deleted", (e: any) => handleEvent(e.detail));
    return () => {
      window.removeEventListener("task:created", (e: any) => handleEvent(e.detail));
      window.removeEventListener("task:updated", (e: any) => handleEvent(e.detail));
      window.removeEventListener("task:deleted", (e: any) => handleEvent(e.detail));
    };
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-gray-500 animate-pulse">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-red-500">Error loading tasks. Please try again later.</div>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;
    if (columns.some((col) => col.key === newStatus)) {
      moveTask(taskId, newStatus as any);
    }
  };

  const handleEditTask = (task: any) => {
    setEditTaskData(task);
    setOpenDialog(true);
  };

  const handleSaveTask = (data: { title: string; description: string; status: TaskStatus; assigneeId?: string }) => {
    if (editTaskData) {
      editTask(editTaskData.id, data);
      setEditTaskData(null);
      setToast({ message: "Task updated!", type: "success" });
    } else {
      addTask({
        title: data.title,
        description: data.description,
        status: data.status,
        assigneeId: data.assigneeId,
      });
      setToast({ message: "Task created!", type: "success" });
    }
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(id);
      setToast({ message: "Task deleted!", type: "success" });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col gap-4 p-4 min-h-screen bg-gray-100">
        {realtimeMsg && (
          <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded mb-2 text-center font-medium animate-fade-in">
            {realtimeMsg}
          </div>
        )}
        <TeamMembers />
        <TaskFilters value={filters} onChange={setFilters} />
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Task Board</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { setOpenDialog(true); setEditTaskData(null); }}
            >
              + New Task
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/users")}
            >
              Manage Users
            </Button>
            <ProfileMenu />
          </div>
        </div>
        <div className="flex gap-4 flex-1 flex-col md:flex-row">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.key);
            return (
              <DroppableColumn key={col.key} colKey={col.key}>
                <h2 className="text-lg font-bold mb-4">{col.title}</h2>
                <div className="min-h-[200px] border-2 border-dashed border-gray-200 rounded flex flex-col gap-2 items-center justify-start">
                  {columnTasks.length === 0 ? (
                    <span className="text-gray-400">No tasks</span>
                  ) : (
                    columnTasks.map((task) => (
                      <DraggableTask
                        key={task.id}
                        task={task}
                        onEdit={() => handleEditTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    ))
                  )}
                </div>
              </DroppableColumn>
            );
          })}
        </div>
        <TaskDialog
          open={openDialog}
          onClose={() => { setOpenDialog(false); setEditTaskData(null); }}
          onSave={handleSaveTask}
          initial={editTaskData}
        />
      </div>
    </DndContext>
  );
} 