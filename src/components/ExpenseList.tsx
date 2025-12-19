import { Receipt } from 'lucide-react';
import { Expense } from '../services/api';

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No expenses yet. Add your first expense!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold p-4 border-b flex items-center gap-2">
        <Receipt className="w-5 h-5" />
        Expenses
      </h2>
      <div className="divide-y">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium">{expense.description}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Paid by {expense.users?.name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">${expense.amount}</div>
                <div className="text-xs text-gray-500 capitalize">{expense.split_type}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {expense.expense_splits?.map((split) => (
                <div key={split.id} className="text-sm text-gray-600 flex justify-between">
                  <span>{split.users?.name}</span>
                  <span>
                    ${split.amount}
                    {split.percentage && ` (${split.percentage}%)`}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-3">
              {new Date(expense.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
