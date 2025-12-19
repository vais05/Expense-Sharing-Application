import { useState, useEffect } from 'react';
import { User } from '../services/api';

interface UserSelectorProps {
  currentUser: User | null;
  onUserChange: (user: User) => void;
  users: User[];
}

export function UserSelector({ currentUser, onUserChange, users }: UserSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Current User
      </label>
      <select
        className="w-full p-2 border border-gray-300 rounded-md"
        value={currentUser?.id || ''}
        onChange={(e) => {
          const user = users.find((u) => u.id === e.target.value);
          if (user) onUserChange(user);
        }}
      >
        <option value="">Select a user</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  );
}
