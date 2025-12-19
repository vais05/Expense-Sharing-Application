import { useState, useEffect } from 'react';
import { Split } from 'lucide-react';
import { api, User, Group, Expense, Balance, UserBalance } from './services/api';
import { UserSelector } from './components/UserSelector';
import { CreateUser } from './components/CreateUser';
import { CreateGroup } from './components/CreateGroup';
import { GroupList } from './components/GroupList';
import { CreateExpense } from './components/CreateExpense';
import { ExpenseList } from './components/ExpenseList';
import { BalanceView } from './components/BalanceView';
import { SettleUp } from './components/SettleUp';

function App() {
  const [expenseFormKey, setExpenseFormKey] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupBalances, setGroupBalances] = useState<Balance[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserGroups();
      loadUserBalances();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupData();
    }
  }, [selectedGroup]);

  const loadUsers = async () => {
    try {
      const { users } = await api.users.getAll();
      setUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserGroups = async () => {
    if (!currentUser) return;
    try {
      const { groups } = await api.groups.getUserGroups(currentUser.id);
      setGroups(groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadGroupData = async () => {
    if (!selectedGroup) return;
    try {
      const [groupDetails, expensesData, balancesData] = await Promise.all([
        api.groups.getById(selectedGroup.id),
        api.expenses.getGroupExpenses(selectedGroup.id),
        api.balances.getGroupBalances(selectedGroup.id),
      ]);
      setSelectedGroup(groupDetails.group);
      setExpenses(expensesData.expenses);
      setGroupBalances(balancesData.balances);
    } catch (error) {
      console.error('Failed to load group data:', error);
    }
  };

  const loadUserBalances = async () => {
    if (!currentUser) return;
    try {
      const balance = await api.balances.getUserBalances(currentUser.id);
      setUserBalance(balance);
    } catch (error) {
      console.error('Failed to load user balances:', error);
    }
  };

  const handleUserCreated = () => {
    loadUsers();
  };

  const handleGroupCreated = () => {
    loadUserGroups();
  };

  const handleExpenseCreated = () => {
    setExpenseFormKey(prev => prev + 1); //  force remount
    loadGroupData();
    loadUserBalances();
  };
  

  const handleSettled = () => {
    loadGroupData();
    loadUserBalances();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Split className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Expense Sharing App</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserSelector
              currentUser={currentUser}
              onUserChange={setCurrentUser}
              users={users}
            />
            <CreateUser onUserCreated={handleUserCreated} />
            {currentUser && (
              <>
                <CreateGroup
                  currentUser={currentUser}
                  users={users}
                  onGroupCreated={handleGroupCreated}
                />
                <GroupList
                  groups={groups}
                  onGroupSelect={setSelectedGroup}
                  selectedGroup={selectedGroup}
                />
              </>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedGroup && currentUser ? (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedGroup.name}</h2>
                  <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.members?.map((member) => (
                      <span
                        key={member.id}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 bg-white rounded-lg shadow p-2">
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex-1 py-2 px-4 rounded transition-colors ${
                      activeTab === 'expenses'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    onClick={() => setActiveTab('balances')}
                    className={`flex-1 py-2 px-4 rounded transition-colors ${
                      activeTab === 'balances'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Balances
                  </button>
                </div>

                {activeTab === 'expenses' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CreateExpense
                      key={`${selectedGroup.id}-${expenseFormKey}`}
                      group={selectedGroup}
                      currentUser={currentUser}
                      onExpenseCreated={handleExpenseCreated}
                    />

                    <ExpenseList expenses={expenses} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SettleUp
                      group={selectedGroup}
                      currentUser={currentUser}
                      onSettled={handleSettled}
                    />
                    <div>
                      <BalanceView
                        groupBalances={groupBalances}
                        userBalance={userBalance}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                {!currentUser
                  ? 'Please select or create a user to get started'
                  : 'Select a group to view expenses and balances'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
