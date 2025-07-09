import { useUsers } from "../context/UserContext";
import { useTasks } from "../context/TaskContext";

export default function TeamMembers() {
  const { users, loading, error } = useUsers();
  const { onlineUsers } = useTasks();
  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <h2 className="text-lg font-bold mb-2">Team Members</h2>
      {loading ? (
        <div className="text-gray-400">Loading team members...</div>
      ) : error ? (
        <div className="text-red-500">Error loading team members.</div>
      ) : (
        <ul className="space-y-1">
          {users.map(user => (
            <li key={user.id} className="text-sm text-gray-700 flex items-center gap-2">
              <span className="font-medium">{user.name}</span>
              {onlineUsers.includes(user.id) && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Online"></span>
              )}
              <span className="text-gray-400">({user.email})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 