const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  members?: User[];
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: 'equal' | 'exact' | 'percentage';
  created_at: string;
  users?: User;
  expense_splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage?: number;
  users?: User;
}

export interface Balance {
  from_user: User;
  to_user: User;
  amount: string;
}

export interface UserBalance {
  owes: { user: User; amount: string }[];
  owed: { user: User; amount: string }[];
  summary: { total_owes: string; total_owed: string };
}

export interface Settlement {
  id: string;
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  settled_at: string;
  paid_by_user?: User;
  paid_to_user?: User;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};

export const api = {
  users: {
    create: async (email: string, name: string): Promise<{ user: User }> => {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      return handleResponse(response);
    },
    getAll: async (): Promise<{ users: User[] }> => {
      const response = await fetch(`${API_URL}/api/users`);
      return handleResponse(response);
    },
    getById: async (id: string): Promise<{ user: User }> => {
      const response = await fetch(`${API_URL}/api/users/${id}`);
      return handleResponse(response);
    },
  },

  groups: {
    create: async (
      name: string,
      description: string,
      created_by: string,
      member_ids: string[]
    ): Promise<{ group: Group }> => {
      const response = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, created_by, member_ids }),
      });
      return handleResponse(response);
    },
    getUserGroups: async (userId: string): Promise<{ groups: Group[] }> => {
      const response = await fetch(`${API_URL}/api/groups/user/${userId}`);
      return handleResponse(response);
    },
    getById: async (id: string): Promise<{ group: Group }> => {
      const response = await fetch(`${API_URL}/api/groups/${id}`);
      return handleResponse(response);
    },
    addMember: async (groupId: string, userId: string): Promise<{ member: any }> => {
      const response = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      return handleResponse(response);
    },
  },

  expenses: {
    create: async (expenseData: {
      group_id: string;
      description: string;
      amount: number;
      paid_by: string;
      split_type: string;
      splits: any[];
    }): Promise<{ expense: Expense }> => {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      return handleResponse(response);
    },
    getGroupExpenses: async (groupId: string): Promise<{ expenses: Expense[] }> => {
      const response = await fetch(`${API_URL}/api/expenses/group/${groupId}`);
      return handleResponse(response);
    },
    getById: async (id: string): Promise<{ expense: Expense }> => {
      const response = await fetch(`${API_URL}/api/expenses/${id}`);
      return handleResponse(response);
    },
  },

  balances: {
    getGroupBalances: async (groupId: string): Promise<{ balances: Balance[] }> => {
      const response = await fetch(`${API_URL}/api/balances/group/${groupId}`);
      return handleResponse(response);
    },
    getUserBalances: async (userId: string): Promise<UserBalance> => {
      const response = await fetch(`${API_URL}/api/balances/user/${userId}`);
      return handleResponse(response);
    },
  },

  settlements: {
    create: async (
      group_id: string,
      paid_by: string,
      paid_to: string,
      amount: number
    ): Promise<{ settlement: Settlement }> => {
      const response = await fetch(`${API_URL}/api/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id, paid_by, paid_to, amount }),
      });
      return handleResponse(response);
    },
    getGroupSettlements: async (groupId: string): Promise<{ settlements: Settlement[] }> => {
      const response = await fetch(`${API_URL}/api/settlements/group/${groupId}`);
      return handleResponse(response);
    },
  },
};
