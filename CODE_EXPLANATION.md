# Code Explanation - Line by Line

This document explains every component of the expense sharing application in detail.

## Table of Contents
1. [Database Schema](#database-schema)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [API Endpoints](#api-endpoints)
5. [Balance Calculation Algorithm](#balance-calculation-algorithm)

---

## Database Schema

### Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Stores user account information.

**Fields**:
- `id`: Unique identifier (UUID) auto-generated for each user
- `email`: User's email address, must be unique across all users
- `name`: Display name for the user
- `created_at`: Timestamp when user account was created

---

### Groups Table
```sql
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Stores expense sharing groups.

**Fields**:
- `id`: Unique group identifier
- `name`: Group name (e.g., "Weekend Trip", "Roommates")
- `description`: Optional description of the group
- `created_by`: Foreign key reference to the user who created the group
- `created_at`: Group creation timestamp

---

### Group Members Table
```sql
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```

**Purpose**: Implements many-to-many relationship between users and groups.

**Fields**:
- `id`: Unique membership identifier
- `group_id`: Reference to the group
- `user_id`: Reference to the user
- `joined_at`: When user joined the group
- `UNIQUE(group_id, user_id)`: Prevents duplicate memberships

**Important**: `ON DELETE CASCADE` means if a group or user is deleted, their memberships are automatically removed.

---

### Expenses Table
```sql
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  paid_by uuid REFERENCES users(id) NOT NULL,
  split_type text NOT NULL CHECK (split_type IN ('equal', 'exact', 'percentage')),
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Records each expense transaction.

**Fields**:
- `id`: Unique expense identifier
- `group_id`: Which group this expense belongs to
- `description`: What the expense was for (e.g., "Dinner", "Hotel")
- `amount`: Total amount as decimal with 2 decimal places
- `paid_by`: Who paid for this expense
- `split_type`: How the expense should be split (equal/exact/percentage)
- `created_at`: When expense was recorded

**Constraints**:
- `CHECK (amount > 0)`: Amount must be positive
- `CHECK (split_type IN ...)`: Only allows valid split types

---

### Expense Splits Table
```sql
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  amount numeric(10, 2) NOT NULL,
  percentage numeric(5, 2) CHECK (percentage >= 0 AND percentage <= 100)
);
```

**Purpose**: Records how each expense is split among users.

**Fields**:
- `id`: Unique split identifier
- `expense_id`: Which expense this split belongs to
- `user_id`: Who owes this portion
- `amount`: How much this user owes (calculated)
- `percentage`: If split_type is percentage, stores the percentage value

**Example**: If expense is $100 split equally among 4 people, there will be 4 rows in this table, each with amount = $25.

---

### Settlements Table
```sql
CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  paid_by uuid REFERENCES users(id) NOT NULL,
  paid_to uuid REFERENCES users(id) NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  settled_at timestamptz DEFAULT now(),
  CHECK (paid_by != paid_to)
);
```

**Purpose**: Records when users settle their debts.

**Fields**:
- `id`: Unique settlement identifier
- `group_id`: Which group this settlement belongs to
- `paid_by`: Who made the payment
- `paid_to`: Who received the payment
- `amount`: Payment amount
- `settled_at`: When payment was made

**Constraints**:
- `CHECK (paid_by != paid_to)`: Prevents self-payments

---

## Backend Architecture

### File: server/config/database.js

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Purpose**: Initializes and exports the Supabase client for database operations.

**Line-by-line**:
1. Imports Supabase client library
2. Imports dotenv to load environment variables from .env file
3. `dotenv.config()` - Loads environment variables into process.env
4. Reads Supabase URL from environment
5. Reads Supabase service key from environment
6. Validates that required credentials exist, throws error if missing
7. Creates and exports Supabase client instance

**Why service_role key?**: The service_role key bypasses Row Level Security, necessary for server-side operations.

---

### File: server/controllers/userController.js

#### createUser Function
```javascript
export const createUser = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, name }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      throw error;
    }

    res.status(201).json({ user: data });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

**Purpose**: Creates a new user in the database.

**Line-by-line**:
1. Async function - handles asynchronous database operations
2. Wraps everything in try-catch for error handling
3. Extracts email and name from request body (sent by frontend)
4. Validates that both email and name are provided
5. If validation fails, returns 400 Bad Request with error message
6. Inserts new user into database using Supabase
7. `.select()` - Returns the inserted data
8. `.single()` - Expects exactly one result
9. Checks if database operation returned an error
10. Special handling for error code '23505' (unique constraint violation) - means email already exists
11. Returns 409 Conflict if email exists
12. Throws other errors to be caught by catch block
13. Returns 201 Created with user data on success
14. Catch block logs error and returns 500 Internal Server Error

---

### File: server/controllers/expenseController.js

#### createExpense Function (Key Parts)
```javascript
if (split_type === 'equal') {
  const splitAmount = parseFloat(amount) / splits.length;
  calculatedSplits = splits.map(user_id => ({
    user_id,
    amount: splitAmount.toFixed(2),
    percentage: null
  }));
}
```

**Purpose**: Calculates equal splits.

**Explanation**:
1. If split type is "equal"
2. Divide total amount by number of people
3. Create array of split objects, one per person
4. Each gets the calculated split amount
5. `.toFixed(2)` rounds to 2 decimal places
6. Percentage is null for equal splits

```javascript
else if (split_type === 'exact') {
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
}
```

**Purpose**: Validates and processes exact amount splits.

**Explanation**:
1. For exact split type
2. Sum all the individual amounts using reduce
3. Check if total of splits equals expense amount (allowing 0.01 difference for floating point)
4. If doesn't match, return error
5. Otherwise, create split objects with exact amounts specified by user

```javascript
else if (split_type === 'percentage') {
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
```

**Purpose**: Validates and processes percentage-based splits.

**Explanation**:
1. For percentage split type
2. Sum all percentages
3. Verify they add up to 100% (with small tolerance for rounding)
4. Calculate actual amounts by: (total amount × percentage / 100)
5. Store both calculated amount and original percentage

---

### File: server/controllers/balanceController.js

#### getGroupBalances Function (Balance Calculation Algorithm)

```javascript
const balances = {};

expenses.forEach(expense => {
  expense.expense_splits.forEach(split => {
    if (split.user_id !== expense.paid_by) {
      const key = `${split.user_id}-${expense.paid_by}`;
      const reverseKey = `${expense.paid_by}-${split.user_id}`;

      if (!balances[key]) balances[key] = 0;
      if (!balances[reverseKey]) balances[reverseKey] = 0;

      balances[key] += parseFloat(split.amount);
    }
  });
});
```

**Purpose**: Calculate who owes whom based on expenses.

**Step-by-step**:
1. Create empty balances object to track debts
2. Loop through each expense
3. For each expense, loop through how it was split
4. Skip if person paid their own portion (they don't owe themselves)
5. Create a key representing "A owes B" (split.user_id owes expense.paid_by)
6. Create reverse key for "B owes A"
7. Initialize both keys if they don't exist
8. Add the split amount to the balance (person owes this much more)

**Example**:
- Alice paid $100 for dinner
- Split equally among Alice, Bob, Charlie ($33.33 each)
- Bob owes Alice $33.33
- Charlie owes Alice $33.33
- Stored as: `{ "bob-alice": 33.33, "charlie-alice": 33.33 }`

```javascript
settlements.forEach(settlement => {
  const key = `${settlement.paid_by}-${settlement.paid_to}`;
  const reverseKey = `${settlement.paid_to}-${settlement.paid_by}`;

  if (!balances[key]) balances[key] = 0;
  if (!balances[reverseKey]) balances[reverseKey] = 0;

  balances[reverseKey] -= parseFloat(settlement.amount);
});
```

**Purpose**: Apply settlements to reduce balances.

**Explanation**:
1. Loop through all recorded settlements
2. If Bob paid Alice $20
3. This reduces what Bob owes Alice (or increases what Alice owes Bob)
4. Subtract settlement amount from the reverse balance
5. This effectively cancels out part of the debt

```javascript
const simplifiedBalances = [];
const processed = new Set();

Object.keys(balances).forEach(key => {
  const [fromUser, toUser] = key.split('-');
  const reverseKey = `${toUser}-${fromUser}`;

  if (!processed.has(key) && !processed.has(reverseKey)) {
    const netBalance = balances[key] - (balances[reverseKey] || 0);

    if (Math.abs(netBalance) > 0.01) {
      if (netBalance > 0) {
        simplifiedBalances.push({
          from_user: fromUser,
          to_user: toUser,
          amount: netBalance.toFixed(2)
        });
      } else {
        simplifiedBalances.push({
          from_user: toUser,
          to_user: fromUser,
          amount: Math.abs(netBalance).toFixed(2)
        });
      }
    }

    processed.add(key);
    processed.add(reverseKey);
  }
});
```

**Purpose**: Simplify balances to show net amounts.

**Explanation**:
1. Create array for simplified balances
2. Create Set to track which user pairs we've processed
3. Loop through all balance keys
4. Split key into two user IDs
5. Check if we haven't processed this pair yet
6. Calculate net balance: (A owes B) - (B owes A)
7. If net balance is significant (> $0.01)
8. If positive: A owes B the net amount
9. If negative: B owes A the absolute amount
10. Add both keys to processed Set so we don't process this pair again

**Example Simplification**:
- Bob owes Alice $100
- Alice owes Bob $30
- Net result: Bob owes Alice $70

---

## Frontend Architecture

### File: src/services/api.ts

This file contains all API calls to the backend.

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```
- Reads API URL from environment variable
- Falls back to localhost:3001 if not set

```typescript
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};
```
- Utility function to handle API responses
- Checks if response is successful
- If not, extracts error message from response
- Throws error with message for try-catch blocks
- Returns parsed JSON on success

```typescript
create: async (email: string, name: string): Promise<{ user: User }> => {
  const response = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
  return handleResponse(response);
}
```
- Makes POST request to create user
- Sets Content-Type header to JSON
- Serializes email and name into JSON
- Calls handleResponse to process result
- Returns parsed user object

---

### File: src/components/CreateExpense.tsx

#### Key State Management
```typescript
const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
const [splits, setSplits] = useState<Record<string, { amount?: string; percentage?: string }>>({});
```

**Purpose**:
- `selectedMembers`: Array of user IDs who are part of this expense
- `splits`: Object mapping user ID to their amount/percentage

**Example splits object**:
```javascript
{
  "user-id-1": { amount: "30.00" },
  "user-id-2": { amount: "40.00" },
  "user-id-3": { amount: "30.00" }
}
```

#### Toggle Member Selection
```typescript
const toggleMember = (userId: string) => {
  setSelectedMembers((prev) =>
    prev.includes(userId)
      ? prev.filter((id) => id !== userId)
      : [...prev, userId]
  );
};
```

**Purpose**: Add or remove user from expense split.

**Logic**:
1. Takes previous state
2. If user is already selected, remove them using filter
3. If user is not selected, add them using spread operator
4. This creates a new array (React requirement for state updates)

#### Validation Example
```typescript
if (splitType === 'exact') {
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
}
```

**Purpose**: Validate exact amounts add up correctly.

**Steps**:
1. Map selected members to split objects with their amounts
2. Use reduce to sum all amounts
3. Compare total to expense amount (with 0.01 tolerance)
4. If doesn't match, show error with helpful message
5. Stop submission if validation fails

---

### File: src/App.tsx

#### Effect Hooks for Data Loading
```typescript
useEffect(() => {
  if (currentUser) {
    loadUserGroups();
    loadUserBalances();
  }
}, [currentUser]);
```

**Purpose**: Reload data when user switches.

**Explanation**:
1. useEffect hook runs when dependencies change
2. Dependency array `[currentUser]` means run when currentUser changes
3. If currentUser exists (not null), load their groups and balances
4. This automatically refreshes data when you switch users

```typescript
useEffect(() => {
  if (selectedGroup) {
    loadGroupData();
  }
}, [selectedGroup]);
```

**Purpose**: Load group details when group is selected.

**Flow**:
1. User clicks on a group in the list
2. `selectedGroup` state updates
3. This useEffect detects the change
4. Calls `loadGroupData()` which fetches:
   - Group details with members
   - All expenses in the group
   - All balances in the group

#### Parallel Data Loading
```typescript
const [groupDetails, expensesData, balancesData] = await Promise.all([
  api.groups.getById(selectedGroup.id),
  api.expenses.getGroupExpenses(selectedGroup.id),
  api.balances.getGroupBalances(selectedGroup.id),
]);
```

**Purpose**: Load multiple things at once for better performance.

**Explanation**:
1. `Promise.all()` runs multiple async operations simultaneously
2. Waits for all to complete before continuing
3. Much faster than loading one after another
4. Destructures results into separate variables
5. Then updates respective state variables

---

### File: src/components/BalanceView.tsx

#### Displaying Balances
```typescript
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
```

**Purpose**: Display simplified balances in readable format.

**Layout**:
- Each balance shows: "[Person A] owes [Person B] $[Amount]"
- Left side: Names with "owes" in between
- Right side: Amount in green
- Rounded background with padding for visual separation

#### Personal Balance Summary
```typescript
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
```

**Purpose**: Show personal debt summary.

**Features**:
- Lists each person you owe with amount
- Red background to indicate debt
- Total at bottom with border separator
- Makes it easy to see your total financial obligations

---

## API Endpoints Detailed

### POST /api/expenses

**Request Body**:
```json
{
  "group_id": "uuid",
  "description": "Dinner at restaurant",
  "amount": 100.00,
  "paid_by": "uuid",
  "split_type": "percentage",
  "splits": [
    { "user_id": "uuid1", "percentage": 50 },
    { "user_id": "uuid2", "percentage": 30 },
    { "user_id": "uuid3", "percentage": 20 }
  ]
}
```

**Process**:
1. Validates required fields exist
2. Validates split_type is valid
3. Based on split_type, calculates actual amounts:
   - Equal: Amount ÷ Number of people
   - Exact: Uses amounts provided (validates sum equals total)
   - Percentage: Amount × Percentage ÷ 100 (validates percentages = 100)
4. Creates expense record in database
5. Creates expense_split records for each person
6. Returns created expense

**Response**:
```json
{
  "expense": {
    "id": "uuid",
    "group_id": "uuid",
    "description": "Dinner at restaurant",
    "amount": 100.00,
    "paid_by": "uuid",
    "split_type": "percentage",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### GET /api/balances/user/:userId

**Purpose**: Get comprehensive balance information for a user across all their groups.

**Process**:
1. Find all groups user belongs to
2. Get all expenses in those groups
3. Get all settlements in those groups
4. For each expense:
   - If user owes someone: Add to their debt
   - If someone owes user: Add to their credit
5. For each settlement:
   - Adjust balances accordingly
6. Separate into two lists: "owes" and "owed"
7. Calculate totals

**Response**:
```json
{
  "owes": [
    {
      "user": { "id": "uuid", "name": "Alice", "email": "alice@example.com" },
      "amount": "45.50"
    }
  ],
  "owed": [
    {
      "user": { "id": "uuid", "name": "Bob", "email": "bob@example.com" },
      "amount": "30.00"
    }
  ],
  "summary": {
    "total_owes": "45.50",
    "total_owed": "30.00"
  }
}
```

---

## Balance Calculation Algorithm

### Complete Example Walkthrough

**Scenario Setup**:
- Group: "Weekend Trip"
- Members: Alice, Bob, Charlie
- Expenses:
  1. Alice paid $300 for hotel, split equally
  2. Bob paid $90 for dinner, split equally
  3. Charlie paid $60 for breakfast, split equally

### Step 1: Process Expenses

**Expense 1**: Alice paid $300, split equally
- Each person owes: $300 ÷ 3 = $100
- Bob owes Alice: $100
- Charlie owes Alice: $100

Balances so far:
```
bob-alice: 100
charlie-alice: 100
```

**Expense 2**: Bob paid $90, split equally
- Each person owes: $90 ÷ 3 = $30
- Alice owes Bob: $30
- Charlie owes Bob: $30

Balances now:
```
bob-alice: 100
charlie-alice: 100
alice-bob: 30
charlie-bob: 30
```

**Expense 3**: Charlie paid $60, split equally
- Each person owes: $60 ÷ 3 = $20
- Alice owes Charlie: $20
- Bob owes Charlie: $20

Final balances:
```
bob-alice: 100
charlie-alice: 100
alice-bob: 30
charlie-bob: 30
alice-charlie: 20
bob-charlie: 20
```

### Step 2: Simplify Balances

**Between Bob and Alice**:
- Bob owes Alice: $100
- Alice owes Bob: $30
- Net: Bob owes Alice $70

**Between Charlie and Alice**:
- Charlie owes Alice: $100
- Alice owes Charlie: $20
- Net: Charlie owes Alice $80

**Between Charlie and Bob**:
- Charlie owes Bob: $30
- Bob owes Charlie: $20
- Net: Charlie owes Bob $10

**Final Simplified Balances**:
```
Bob owes Alice: $70
Charlie owes Alice: $80
Charlie owes Bob: $10
```

### Step 3: Apply Settlement

If Charlie pays Alice $50:
- Charlie owes Alice: $80 - $50 = $30
- Charlie owes Bob: $10 (unchanged)

**New Balances**:
```
Bob owes Alice: $70
Charlie owes Alice: $30
Charlie owes Bob: $10
```

---

## Key Design Patterns

### 1. Controller Pattern (Backend)
Each controller handles one domain:
- userController: User operations
- groupController: Group operations
- expenseController: Expense operations
- balanceController: Balance calculations
- settlementController: Settlement operations

**Benefits**:
- Separation of concerns
- Easy to test individual controllers
- Clear responsibility boundaries

### 2. Service Layer Pattern (Frontend)
All API calls go through `src/services/api.ts`:
- Centralizes API communication
- Provides type safety with TypeScript
- Easy to mock for testing
- Single place to change API URLs

### 3. Lift State Up Pattern (Frontend)
Main state in App.tsx, passed down to components:
- Single source of truth
- Child components are presentational
- Easy to track data flow
- Simplifies debugging

### 4. Optimistic UI Updates
After creating expense/settlement:
- Immediately refresh related data
- User sees changes instantly
- Provides smooth user experience

---

## Common Operations Explained

### Creating an Expense with Equal Split

**Frontend Flow**:
1. User fills form: description, amount, split type = "equal"
2. User selects 3 members to split with
3. Clicks "Add Expense"
4. Frontend sends: `{ splits: [userId1, userId2, userId3] }`

**Backend Processing**:
1. Receives array of user IDs
2. Calculates: $100 ÷ 3 = $33.33 each
3. Creates expense record
4. Creates 3 expense_split records:
   - userId1: $33.33
   - userId2: $33.33
   - userId3: $33.34 (slightly more to account for rounding)

### Calculating User Balance

**Process**:
1. Find all groups user is in
2. Get ALL expenses in those groups
3. For each expense:
   - Find the split for this user
   - If user didn't pay: They owe that amount to who paid
   - If user paid: Others owe them their split amounts
4. Get all settlements where user was involved
5. Subtract settlements from balances
6. Group by: people user owes vs. people who owe user
7. Calculate totals

### Settling Up

**User Action**: Bob selects "Pay to Alice" for $50

**Backend Process**:
1. Creates settlement record:
   ```json
   {
     "paid_by": "bob-uuid",
     "paid_to": "alice-uuid",
     "amount": 50
   }
   ```
2. When balances are next calculated:
   - Gets this settlement record
   - Subtracts $50 from what Bob owes Alice
   - Updates displayed balances

**Frontend Update**:
1. Settlement recorded successfully
2. Calls `loadGroupData()` to refresh balances
3. New balances displayed immediately

---

## Error Handling Patterns

### Backend Error Handling
```javascript
try {
  // Database operation
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

**Layers**:
1. Try-catch around all async operations
2. Specific error codes for known issues (409 for duplicates)
3. Generic 500 for unexpected errors
4. Always log errors for debugging
5. Never expose internal details to client

### Frontend Error Handling
```typescript
try {
  await api.expenses.create(expenseData);
  // Success: clear form and refresh
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to create expense');
  // Show error to user
}
```

**Pattern**:
1. Try-catch around API calls
2. Extract error message safely
3. Display error in UI
4. Don't refresh data on error
5. Let user retry

---

## Performance Optimizations

### 1. Parallel Data Loading
```typescript
await Promise.all([
  api.groups.getById(groupId),
  api.expenses.getGroupExpenses(groupId),
  api.balances.getGroupBalances(groupId),
]);
```
Loads all group data simultaneously instead of sequentially.

### 2. Selective Data Refresh
Only refresh data that changed:
- After creating expense: Refresh expenses and balances only
- After settling up: Refresh balances only
- After creating group: Refresh groups list only

### 3. Database Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
```
Indexes on foreign keys speed up lookups significantly.

### 4. Simplified Balance Calculation
Calculate net balances instead of showing every transaction pair, reducing data to display.

---

## Security Considerations

### 1. Row Level Security (RLS)
- Users can only see groups they belong to
- Prevents unauthorized data access
- Enforced at database level

### 2. Input Validation
- Backend validates all inputs
- Checks for required fields
- Validates amounts are positive
- Verifies split calculations are correct

### 3. Service Role Key
- Backend uses service_role key for database access
- Frontend never sees database credentials
- API acts as security boundary

### 4. Error Messages
- Generic error messages to users
- Detailed errors only in server logs
- Prevents information leakage

---

## Testing the System

### Manual Test Scenario

**Setup**:
1. Create users: Alice, Bob, Charlie
2. Alice creates group "Trip" with all three
3. Alice adds expense: Hotel $300, equal split
4. Bob adds expense: Dinner $90, exact amounts (Alice: $30, Bob: $40, Charlie: $20)
5. Charlie adds expense: Breakfast $60, percentage (Alice: 50%, Bob: 30%, Charlie: 20%)

**Expected Balances Before Settlement**:
- Bob owes Alice: $100 - $40 = $60
- Charlie owes Alice: $100 - $20 - $30 = $50
- Charlie owes Bob: $30 + $18 - $40 = $8

**Verification**:
- View balances from each user's perspective
- Should show same amounts from different angles
- Total owed across system should equal total owing

**Settlement Test**:
- Charlie pays Alice $50
- Verify Charlie-Alice balance becomes $0
- Verify other balances unchanged
- Check settlement appears in history

---

This completes the comprehensive code explanation. Every component, algorithm, and design decision has been documented with examples.
