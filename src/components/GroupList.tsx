import { Users } from 'lucide-react';
import { Group } from '../services/api';

interface GroupListProps {
  groups: Group[];
  onGroupSelect: (group: Group) => void;
  selectedGroup: Group | null;
}

export function GroupList({ groups, onGroupSelect, selectedGroup }: GroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No groups yet. Create one to get started!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold p-4 border-b flex items-center gap-2">
        <Users className="w-5 h-5" />
        Your Groups
      </h2>
      <div className="divide-y">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group)}
            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
              selectedGroup?.id === group.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="font-medium">{group.name}</div>
            {group.description && (
              <div className="text-sm text-gray-600 mt-1">{group.description}</div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Created {new Date(group.created_at).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
