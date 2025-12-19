import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { api, Group, User } from '../services/api';

interface CreateExpenseProps {
  group: Group;
  currentUser: User;
  onExpenseCreated: () => void;
}

type SplitType = 'equal' | 'exact' | 'percentage';

interface Split {
  user_id: string;
  amount?: number;
  percentage?: number;
}

export function CreateExpense({ group, currentUser, onExpenseCreated }: CreateExpenseProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splits, setSplits] = useState<Record<string, { amount?: string; percentage?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedMembers.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    setLoading(true);

    try {
      let splitData: any[];

      if (splitType === 'equal') {
        splitData = selectedMembers;
      } else if (splitType === 'exact') {
        splitData = selectedMembers.map((user_id) => ({
          user_id,
          amount: parseFloat(splits[user_id]?.amount || '0'),
        }));

        const total = splitData.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(total - parseFloat(amount)) > 0.01) {
          setError(`Exact splits must equal ${amount}. Current total: ${total.toFixed(2)}`);
          setLoading(false);
          return;
        }
      } else {
        splitData = selectedMembers.map((user_id) => ({
          user_id,
          percentage: parseFloat(splits[user_id]?.percentage || '0'),
        }));

        const total = splitData.reduce((sum, s) => sum + s.percentage, 0);
        if (Math.abs(total - 100) > 0.01) {
          setError(`Percentages must equal 100%. Current total: ${total.toFixed(2)}%`);
          setLoading(false);
          return;
        }
      }

      await api.expenses.create({
        group_id: group.id,
        description,
        amount: parseFloat(amount),
        paid_by: currentUser.id,
        split_type: splitType,
        splits: splitData,
      });

      setDescription('');
      setAmount('');
      setSelectedMembers([]);
      setSplits({});
      onExpenseCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const updateSplit = (userId: string, field: 'amount' | 'percentage', value: string) => {
    setSplits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5" />
        Add Expense
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Dinner, groceries, etc."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Split Type</label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as SplitType)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="equal">Equal Split</option>
            <option value="exact">Exact Amounts</option>
            <option value="percentage">Percentage Split</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split Between (Paid by you)
          </label>
          <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3">
            {group.members?.map((member) => (
              <div key={member.id} className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">{member.name}</span>
                </label>
                {selectedMembers.includes(member.id) && splitType === 'exact' && (
                  <input
                    type="number"
                    step="0.01"
                    value={splits[member.id]?.amount || ''}
                    onChange={(e) => updateSplit(member.id, 'amount', e.target.value)}
                    className="ml-6 w-32 p-1 border border-gray-300 rounded text-sm"
                    placeholder="Amount"
                  />
                )}
                {selectedMembers.includes(member.id) && splitType === 'percentage' && (
                  <input
                    type="number"
                    step="0.01"
                    value={splits[member.id]?.percentage || ''}
                    onChange={(e) => updateSplit(member.id, 'percentage', e.target.value)}
                    className="ml-6 w-32 p-1 border border-gray-300 rounded text-sm"
                    placeholder="Percentage"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}
