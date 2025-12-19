import { supabase } from '../config/database.js';

export const createGroup = async (req, res) => {
  try {
    const { name, description, created_by, member_ids } = req.body;

    if (!name || !created_by) {
      return res.status(400).json({ error: 'Name and created_by are required' });
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([{ name, description: description || '', created_by }])
      .select()
      .single();

    if (groupError) throw groupError;

    const members = member_ids && member_ids.length > 0
      ? member_ids.map(user_id => ({ group_id: group.id, user_id }))
      : [{ group_id: group.id, user_id: created_by }];

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(members);

    if (membersError) throw membersError;

    res.status(201).json({ group });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups (
          id,
          name,
          description,
          created_by,
          created_at,
          users!groups_created_by_fkey (
            id,
            name,
            email
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const groups = data.map(item => item.groups);

    res.json({ groups });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        *,
        users!groups_created_by_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (groupError) throw groupError;

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        users (
          id,
          name,
          email
        )
      `)
      .eq('group_id', id);

    if (membersError) throw membersError;

    group.members = members.map(m => m.users);

    res.json({ group });
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data, error } = await supabase
      .from('group_members')
      .insert([{ group_id: groupId, user_id }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'User is already a member of this group' });
      }
      throw error;
    }

    res.status(201).json({ member: data });
  } catch (error) {
    console.error('Error adding group member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
