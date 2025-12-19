import { supabase } from '../config/database.js';

export const createExpense = async (req, res) => {
  try {
    const { group_id, description, amount, paid_by, split_type, splits } = req.body;

    if (!group_id || !description || !amount || !paid_by || !split_type || !splits) {
      return res.status(400).json({
        error: 'group_id, description, amount, paid_by, split_type, and splits are required'
      });
    }

    if (!['equal', 'exact', 'percentage'].includes(split_type)) {
      return res.status(400).json({
        error: 'split_type must be equal, exact, or percentage'
      });
    }

    let calculatedSplits = [];

    if (split_type === 'equal') {
      const splitAmount = parseFloat(amount) / splits.length;
      calculatedSplits = splits.map(user_id => ({
        user_id,
        amount: splitAmount.toFixed(2),
        percentage: null
      }));
    } else if (split_type === 'exact') {
      const totalSplit = splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
      if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
        return res.status(400).json({
          error: 'Sum of exact splits must equal total amount'
        });
      }
      calculatedSplits = splits.map(split => ({
        user_id: split.user_id,
        amount: parseFloat(split.amount).toFixed(2),
        percentage: null
      }));
    } else if (split_type === 'percentage') {
      const totalPercentage = splits.reduce((sum, split) => sum + parseFloat(split.percentage), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({
          error: 'Sum of percentages must equal 100'
        });
      }
      calculatedSplits = splits.map(split => ({
        user_id: split.user_id,
        amount: (parseFloat(amount) * parseFloat(split.percentage) / 100).toFixed(2),
        percentage: parseFloat(split.percentage)
      }));
    }

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([{
        group_id,
        description,
        amount: parseFloat(amount),
        paid_by,
        split_type
      }])
      .select()
      .single();

    if (expenseError) throw expenseError;

    const expenseSplits = calculatedSplits.map(split => ({
      expense_id: expense.id,
      user_id: split.user_id,
      amount: parseFloat(split.amount),
      percentage: split.percentage
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(expenseSplits);

    if (splitsError) throw splitsError;

    res.status(201).json({ expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_paid_by_fkey (
          id,
          name,
          email
        ),
        expense_splits (
          id,
          user_id,
          amount,
          percentage,
          users (
            id,
            name,
            email
          )
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ expenses: data });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_paid_by_fkey (
          id,
          name,
          email
        ),
        expense_splits (
          id,
          user_id,
          amount,
          percentage,
          users (
            id,
            name,
            email
          )
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense: data });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
