import { supabase } from '../config/database.js';
import { validate as isUUID } from 'uuid';

export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log(' Group ID received:', groupId);

    if (!isUUID(groupId)) {
      return res.status(400).json({ error: 'Invalid groupId' });
    }


    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id,
        amount,
        paid_by,
        expense_splits (
          user_id,
          amount
        )
      `)
      .eq('group_id', groupId);

    if (expensesError) throw expensesError;

    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId);

    if (settlementsError) throw settlementsError;

    const balances = {};

    expenses.forEach(expense => {
      expense.expense_splits.forEach(split => {
        if (split.user_id !== expense.paid_by) {
          const key = `${split.user_id}-${expense.paid_by}`;
          balances[key] = (balances[key] || 0) + Number(split.amount);
        }
      });
    });

    settlements.forEach(settlement => {
      const key = `${settlement.paid_to}-${settlement.paid_by}`;
      balances[key] = (balances[key] || 0) - Number(settlement.amount);
    });

    const simplifiedBalances = [];
    const processed = new Set();

    for (const key in balances) {
      const [fromUser, toUser] = key.split('-');
      const reverseKey = `${toUser}-${fromUser}`;

      if (processed.has(key) || processed.has(reverseKey)) continue;

      const net =
        (balances[key] || 0) - (balances[reverseKey] || 0);

      if (Math.abs(net) > 0.01) {
        simplifiedBalances.push({
          from_user: net > 0 ? fromUser : toUser,
          to_user: net > 0 ? toUser : fromUser,
          amount: Math.abs(net).toFixed(2),
        });
      }

      processed.add(key);
      processed.add(reverseKey);
    }

    const userIds = [
      ...new Set(
        simplifiedBalances.flatMap(b => [b.from_user, b.to_user])
      ),
    ];

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError) throw usersError;

    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user;
    });

    res.json({
      balances: simplifiedBalances.map(b => ({
        from_user: userMap[b.from_user],
        to_user: userMap[b.to_user],
        amount: b.amount,
      })),
    });
  } catch (error) {
    console.error('Error calculating balances:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserBalances = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔎 User ID received:', userId);

    if (!isUUID(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (membershipError) throw membershipError;

    const groupIds = memberships.map(m => m.group_id);

    if (groupIds.length === 0) {
      return res.json({
        owes: [],
        owed: [],
        summary: { total_owes: '0.00', total_owed: '0.00' },
      });
    }

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id,
        amount,
        paid_by,
        group_id,
        expense_splits (
          user_id,
          amount
        )
      `)
      .in('group_id', groupIds);

    if (expensesError) throw expensesError;

    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .in('group_id', groupIds);

    if (settlementsError) throw settlementsError;

    const balances = {};

    expenses.forEach(expense => {
      expense.expense_splits.forEach(split => {
        if (split.user_id === userId && expense.paid_by !== userId) {
          balances[expense.paid_by] =
            (balances[expense.paid_by] || 0) + Number(split.amount);
        } else if (
          expense.paid_by === userId &&
          split.user_id !== userId
        ) {
          balances[split.user_id] =
            (balances[split.user_id] || 0) - Number(split.amount);
        }
      });
    });

    settlements.forEach(settlement => {
      if (settlement.paid_by === userId) {
        balances[settlement.paid_to] =
          (balances[settlement.paid_to] || 0) - Number(settlement.amount);
      } else if (settlement.paid_to === userId) {
        balances[settlement.paid_by] =
          (balances[settlement.paid_by] || 0) - Number(settlement.amount);
      }
    });

    const userIds = Object.keys(balances);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError) throw usersError;

    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user;
    });

    const owes = [];
    const owed = [];

    for (const otherUserId in balances) {
      const value = balances[otherUserId];
      if (Math.abs(value) > 0.01) {
        if (value > 0) {
          owes.push({
            user: userMap[otherUserId],
            amount: value.toFixed(2),
          });
        } else {
          owed.push({
            user: userMap[otherUserId],
            amount: Math.abs(value).toFixed(2),
          });
        }
      }
    }

    const total_owes = owes
      .reduce((s, i) => s + Number(i.amount), 0)
      .toFixed(2);

    const total_owed = owed
      .reduce((s, i) => s + Number(i.amount), 0)
      .toFixed(2);

    res.json({
      owes,
      owed,
      summary: { total_owes, total_owed },
    });
  } catch (error) {
    console.error('Error calculating user balances:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
