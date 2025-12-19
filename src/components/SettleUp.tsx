import { useState } from 'react';
import { HandCoins } from 'lucide-react';
import { api, Group, User } from '../services/api';

interface SettleUpProps {
  group: Group;
  currentUser: User;
  onSettled: () => void;
}

export function SettleUp({ group, currentUser, onSettled }: SettleUpProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);

    try {
      await api.settlements.create(
        group.id,
        currentUser.id,
        selectedUser,
        parseFloat(amount)
      );

      setSelectedUser('');
      setAmount('');
      onSettled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <HandCoins className="w-5 h-5" />
        Settle Up
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pay To</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select a user</option>
            {group.members
              ?.filter((member) => member.id !== currentUser.id)
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="0.00"
            required
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}
