import { supabase } from '../config/database.js';

export const createSettlement = async (req, res) => {
  try {
    const { group_id, paid_by, paid_to, amount } = req.body;

    if (!group_id || !paid_by || !paid_to || !amount) {
      return res.status(400).json({
        error: 'group_id, paid_by, paid_to, and amount are required'
      });
    }

    if (paid_by === paid_to) {
      return res.status(400).json({
        error: 'paid_by and paid_to must be different users'
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: 'amount must be greater than 0'
      });
    }

    const { data, error } = await supabase
      .from('settlements')
      .insert([{
        group_id,
        paid_by,
        paid_to,
        amount: parseFloat(amount)
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ settlement: data });
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const { data, error } = await supabase
      .from('settlements')
      .select(`
        *,
        paid_by_user:users!settlements_paid_by_fkey (
          id,
          name,
          email
        ),
        paid_to_user:users!settlements_paid_to_fkey (
          id,
          name,
          email
        )
      `)
      .eq('group_id', groupId)
      .order('settled_at', { ascending: false });

    if (error) throw error;

    res.json({ settlements: data });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
