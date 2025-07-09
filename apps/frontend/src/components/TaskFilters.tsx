import React from "react";
import { useUsers } from "../context/UserContext";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";

export interface TaskFilterValues {
  search: string;
  assigneeId: string;
  from: string;
  to: string;
}

interface TaskFiltersProps {
  value: TaskFilterValues;
  onChange: (value: TaskFilterValues) => void;
}

function FiltersForm({ value, onChange }: TaskFiltersProps) {
  const { users } = useUsers();
  return (
    <form className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium mb-1" htmlFor="task-search">Search</label>
        <Input
          id="task-search"
          type="text"
          placeholder="Title or description"
          value={value.search}
          onChange={e => onChange({ ...value, search: e.target.value })}
          className="w-64"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium mb-1" htmlFor="task-assignee">Assignee</label>
        <Select value={value.assigneeId || "all"} onValueChange={v => onChange({ ...value, assigneeId: v === "all" ? "" : v })}>
          <SelectTrigger className="w-40" id="task-assignee">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium mb-1" htmlFor="task-from">From</label>
        <Input
          id="task-from"
          type="date"
          value={value.from}
          onChange={e => onChange({ ...value, from: e.target.value })}
          className="w-36"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium mb-1" htmlFor="task-to">To</label>
        <Input
          id="task-to"
          type="date"
          value={value.to}
          onChange={e => onChange({ ...value, to: e.target.value })}
          className="w-36"
        />
      </div>
    </form>
  );
}

export default function TaskFilters({ value, onChange }: TaskFiltersProps) {
  const [open, setOpen] = React.useState(false);
  // Show dialog on mobile, inline on desktop
  return (
    <div className="mb-4">
      {/* Mobile: show filter button */}
      <div className="sm:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded shadow-sm text-gray-700 font-medium w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-2-1A1 1 0 019 18v-4.586a1 1 0 00-.293-.707L2.293 6.707A1 1 0 012 6V5a1 1 0 011-1z" /></svg>
              Filters
            </button>
          </DialogTrigger>
          <DialogContent showCloseButton>
            <h2 className="text-lg font-bold mb-4">Filters</h2>
            <FiltersForm value={value} onChange={onChange} />
          </DialogContent>
        </Dialog>
      </div>
      {/* Desktop: show filters inline */}
      <div className="hidden sm:block bg-white/80 border border-gray-200 rounded-lg shadow-sm px-4 py-3">
        <FiltersForm value={value} onChange={onChange} />
      </div>
    </div>
  );
} 