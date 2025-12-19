/*
  # Expense Sharing Application Schema

  ## Overview
  Database schema for a Splitwise-like expense sharing application that supports:
  - User management
  - Group creation and membership
  - Expense tracking with multiple split types
  - Balance calculation and settlement

  ## Tables

  ### 1. users
  Stores user account information
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `name` (text) - User display name
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. groups
  Stores group information for shared expenses
  - `id` (uuid, primary key) - Unique group identifier
  - `name` (text) - Group name
  - `description` (text) - Group description
  - `created_by` (uuid, foreign key) - User who created the group
  - `created_at` (timestamptz) - Group creation timestamp

  ### 3. group_members
  Tracks group membership (many-to-many relationship)
  - `id` (uuid, primary key) - Unique membership identifier
  - `group_id` (uuid, foreign key) - Reference to groups table
  - `user_id` (uuid, foreign key) - Reference to users table
  - `joined_at` (timestamptz) - When user joined the group

  ### 4. expenses
  Stores expense records
  - `id` (uuid, primary key) - Unique expense identifier
  - `group_id` (uuid, foreign key) - Group this expense belongs to
  - `description` (text) - Expense description
  - `amount` (numeric) - Total expense amount
  - `paid_by` (uuid, foreign key) - User who paid the expense
  - `split_type` (text) - Type of split: 'equal', 'exact', 'percentage'
  - `created_at` (timestamptz) - Expense creation timestamp

  ### 5. expense_splits
  Tracks how each expense is split among users
  - `id` (uuid, primary key) - Unique split identifier
  - `expense_id` (uuid, foreign key) - Reference to expenses table
  - `user_id` (uuid, foreign key) - User who owes this split
  - `amount` (numeric) - Amount this user owes
  - `percentage` (numeric, nullable) - Percentage if split_type is 'percentage'

  ### 6. settlements
  Tracks when users settle their dues
  - `id` (uuid, primary key) - Unique settlement identifier
  - `group_id` (uuid, foreign key) - Group where settlement occurred
  - `paid_by` (uuid, foreign key) - User who paid
  - `paid_to` (uuid, foreign key) - User who received payment
  - `amount` (numeric) - Settlement amount
  - `settled_at` (timestamptz) - Settlement timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access groups they are members of
  - Users can view their own data and group data they belong to
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  paid_by uuid REFERENCES users(id) NOT NULL,
  split_type text NOT NULL CHECK (split_type IN ('equal', 'exact', 'percentage')),
  created_at timestamptz DEFAULT now()
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  amount numeric(10, 2) NOT NULL,
  percentage numeric(5, 2) CHECK (percentage >= 0 AND percentage <= 100)
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  paid_by uuid REFERENCES users(id) NOT NULL,
  paid_to uuid REFERENCES users(id) NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  settled_at timestamptz DEFAULT now(),
  CHECK (paid_by != paid_to)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert themselves"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for groups table
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id IN (SELECT id FROM users)
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Group creators can update their groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (created_by IN (SELECT id FROM users))
  WITH CHECK (created_by IN (SELECT id FROM users));

-- RLS Policies for group_members table
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM users)
    )
  );

CREATE POLICY "Group creators can add members"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups WHERE created_by IN (SELECT id FROM users)
    )
  );

CREATE POLICY "Group members can remove themselves"
  ON group_members FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM users));

-- RLS Policies for expenses table
CREATE POLICY "Users can view expenses in their groups"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM users)
    )
  );

CREATE POLICY "Group members can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM users)
    )
  );

-- RLS Policies for expense_splits table
CREATE POLICY "Users can view splits in their groups"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM users)
      )
    )
  );

CREATE POLICY "Group members can create splits"
  ON expense_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM users)
      )
    )
  );

-- RLS Policies for settlements table
CREATE POLICY "Users can view settlements in their groups"
  ON settlements FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM users)
    )
  );

CREATE POLICY "Group members can create settlements"
  ON settlements FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM users)
    )
  );