import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Balance, UserBalance } from '../services/api';

interface BalanceViewProps {
  groupBalances: Balance[];
  userBalance: UserBalance | null;
}

export function BalanceView({ groupBalances, userBalance }: BalanceViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Group Balances
        </h2>
        {groupBalances.length === 0 ? (
          <div className="text-center text-gray-500 py-4">All settled up!</div>
        ) : (
          <div className="space-y-3">
            {groupBalances.map((balance, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{balance.from_user.name}</span>
                  <span className="text-gray-500">owes</span>
                  <span className="font-medium">{balance.to_user.name}</span>
                </div>
                <span className="font-semibold text-lg text-green-600">
                  ${balance.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {userBalance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
              <TrendingDown className="w-5 h-5" />
              You Owe
            </h3>
            {userBalance.owes.length === 0 ? (
              <div className="text-center text-gray-500 py-4">You don't owe anyone</div>
            ) : (
              <div className="space-y-2">
                {userBalance.owes.map((owe, index) => (
                  <div key={index} className="flex justify-between p-2 bg-red-50 rounded">
                    <span>{owe.user.name}</span>
                    <span className="font-semibold">${owe.amount}</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-red-600">${userBalance.summary.total_owes}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              You Are Owed
            </h3>
            {userBalance.owed.length === 0 ? (
              <div className="text-center text-gray-500 py-4">Nobody owes you</div>
            ) : (
              <div className="space-y-2">
                {userBalance.owed.map((owed, index) => (
                  <div key={index} className="flex justify-between p-2 bg-green-50 rounded">
                    <span>{owed.user.name}</span>
                    <span className="font-semibold">${owed.amount}</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">${userBalance.summary.total_owed}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
