# Expense Sharing Application

A full-stack expense sharing application similar to Splitwise, built with React, TypeScript, Node.js, Express, and PostgreSQL (Supabase).

## Features

### User Management
- Create and manage users
- Switch between different user accounts
- View all users in the system

### Group Management
- Create expense groups
- Add multiple members to groups
- View all groups a user belongs to
- Track group membership

### Expense Tracking
- Add shared expenses with descriptions and amounts
- Support for three split types:
  - **Equal Split**: Divide expense equally among all members
  - **Exact Amount**: Specify exact amount each person owes
  - **Percentage Split**: Split by percentages (must total 100%)
- Track who paid for each expense
- View detailed expense history with split breakdowns

### Balance Management
- Real-time balance calculations
- View group balances (who owes whom)
- Personal balance summary:
  - See who you owe money to
  - See who owes you money
  - Total amounts owed and receivable
- Simplified balance tracking (net balances)

### Settlement System
- Record payments between users
- Settle dues within groups
- Track settlement history
- Automatic balance updates after settlements

## Technology Stack

### Backend
- **Node.js** with **Express.js**
- **PostgreSQL** database (via Supabase)
- **@supabase/supabase-js** for database operations
- RESTful API architecture

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Project Structure

```
expense-sharing-app/
├── server/                    # Backend Express server
│   ├── config/               # Configuration files
│   │   └── database.js       # Supabase client setup
│   ├── controllers/          # Request handlers
│   │   ├── userController.js
│   │   ├── groupController.js
│   │   ├── expenseController.js
│   │   ├── balanceController.js
│   │   └── settlementController.js
│   ├── routes/              # API route definitions
│   │   ├── userRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── balanceRoutes.js
│   │   └── settlementRoutes.js
│   ├── index.js             # Server entry point
│   └── package.json         # Backend dependencies
│
├── src/                     # Frontend React app
│   ├── components/          # React components
│   │   ├── UserSelector.tsx
│   │   ├── CreateUser.tsx
│   │   ├── CreateGroup.tsx
│   │   ├── GroupList.tsx
│   │   ├── CreateExpense.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── BalanceView.tsx
│   │   └── SettleUp.tsx
│   ├── services/           # API service layer
│   │   └── api.ts
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Frontend entry point
│
└── supabase/               # Database migrations
    └── migrations/
```

## Database Schema

### Tables

1. **users** - User accounts
   - id, email, name, created_at

2. **groups** - Expense groups
   - id, name, description, created_by, created_at

3. **group_members** - Group membership (many-to-many)
   - id, group_id, user_id, joined_at

4. **expenses** - Expense records
   - id, group_id, description, amount, paid_by, split_type, created_at

5. **expense_splits** - How expenses are split
   - id, expense_id, user_id, amount, percentage

6. **settlements** - Payment settlements
   - id, group_id, paid_by, paid_to, amount, settled_at

All tables have Row Level Security (RLS) enabled with appropriate policies.

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/user/:userId` - Get all groups for a user
- `GET /api/groups/:id` - Get group details with members
- `POST /api/groups/:groupId/members` - Add member to group

### Expenses
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/group/:groupId` - Get all expenses for a group
- `GET /api/expenses/:id` - Get expense by ID with splits

### Balances
- `GET /api/balances/group/:groupId` - Get simplified balances for a group
- `GET /api/balances/user/:userId` - Get balance summary for a user

### Settlements
- `POST /api/settlements` - Record a settlement/payment
- `GET /api/settlements/group/:groupId` - Get settlement history for a group

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Step 1: Clone the Repository
```bash
# This project is already set up in your current directory
cd /path/to/project
```

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `server/.env` and add your Supabase credentials:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
PORT=3001
```

**Where to find Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click on "Settings" (gear icon) in the sidebar
3. Navigate to "API" section
4. Copy the "Project URL" for `SUPABASE_URL`
5. Copy the "service_role" key (NOT the anon key) for `SUPABASE_SERVICE_KEY`

### Step 3: Frontend Setup

```bash
# Navigate back to project root
cd ..

# Install frontend dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` and add:
```env
VITE_API_URL=http://localhost:3001
```

### Step 4: Database Setup

The database schema has already been created in your Supabase project. You can verify by:
1. Go to Supabase Dashboard
2. Navigate to "Table Editor"
3. You should see tables: users, groups, group_members, expenses, expense_splits, settlements

## Running the Application

You need to run both the backend and frontend servers.

### Terminal 1 - Start Backend Server
```bash
cd server
npm start
```

The backend API will be available at `http://localhost:3001`

### Terminal 2 - Start Frontend Development Server
```bash
# From project root
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the URL shown in terminal)

## How to Use the Application

### 1. Create Users
- First, create at least 2-3 users using the "Create New User" form
- Each user needs a name and email address

### 2. Select a User
- Use the "Current User" dropdown to select which user you're acting as
- This simulates switching between different user accounts

### 3. Create a Group
- With a user selected, create a group using the "Create New Group" form
- Give it a name and optional description
- Select which users should be members of the group
- The creator is automatically added as a member

### 4. Add Expenses
- Select a group from the "Your Groups" list
- Click the "Expenses" tab (active by default)
- Use the "Add Expense" form to record a new expense
- Fill in:
  - Description (e.g., "Dinner at restaurant")
  - Amount (e.g., 100.00)
  - Split type (Equal, Exact, or Percentage)
  - Select members to split with
  - If using Exact or Percentage, enter the specific amounts/percentages

### 5. View Balances
- Click the "Balances" tab
- **Group Balances**: Shows simplified balances between all group members
- **Personal Balances**: Shows what you owe and what others owe you across all groups

### 6. Settle Up
- In the "Balances" tab, use the "Settle Up" form
- Select who you're paying
- Enter the amount
- This records the payment and updates all balances automatically

## Understanding Split Types

### Equal Split
Divides the total amount equally among selected members.
- Example: $100 split equally among 4 people = $25 each

### Exact Amount
You specify exactly how much each person owes.
- The sum of all amounts must equal the total expense
- Example: $100 total - Person A owes $30, Person B owes $40, Person C owes $30

### Percentage Split
You specify what percentage each person owes.
- All percentages must add up to 100%
- Example: $100 total - Person A 50%, Person B 30%, Person C 20%

## Balance Calculation Logic

The application uses a sophisticated balance calculation algorithm:

1. **Expense Tracking**: When an expense is added, the system records who paid and how it was split
2. **Net Balances**: Balances between two users are simplified (if A owes B $50 and B owes A $30, result is A owes B $20)
3. **Settlement Impact**: When you record a settlement, it reduces the outstanding balance
4. **Real-time Updates**: All balances update immediately when expenses or settlements are added

## Testing the Application

### Example Scenario
1. Create users: Alice, Bob, Charlie
2. Login as Alice, create a group "Weekend Trip" with all three members
3. As Alice, add expense "Hotel" for $300, split equally
4. As Bob (switch user), add expense "Dinner" for $90, split equally
5. View balances - see who owes whom
6. As Charlie (switch user), settle up with Alice for $130

## Building for Production

### Backend
```bash
cd server
npm start
```

### Frontend
```bash
# From project root
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Troubleshooting

### Backend Issues
- **Port already in use**: Change `PORT` in `server/.env`
- **Database connection failed**: Verify Supabase credentials in `server/.env`
- **CORS errors**: Ensure frontend URL is correct in CORS configuration

### Frontend Issues
- **API connection failed**: Check that backend is running and `VITE_API_URL` is correct
- **Build errors**: Run `npm install` to ensure all dependencies are installed

### Database Issues
- **RLS Policy errors**: Ensure you're using the service_role key (not anon key) in backend
- **Missing tables**: Run the migration again or check Supabase dashboard

## Assignment Requirements Checklist

- [x] Backend: Node.js with Express
- [x] Database: PostgreSQL (via Supabase)
- [x] Create groups
- [x] Add shared expenses
- [x] Track balances
- [x] Settle dues
- [x] Equal split support
- [x] Exact amount split support
- [x] Percentage split support
- [x] Balance tracking (who owes whom)
- [x] User can see what they owe
- [x] User can see what others owe them
- [x] Simplified balances

## Key Design Decisions

1. **Separation of Concerns**: Backend and frontend are completely separate, communicating via REST API
2. **Database-First Approach**: All business logic calculations are done in application code, not in database
3. **Simplified Balances**: Net balances between users are calculated to show only the minimal transactions needed
4. **User Simulation**: Instead of authentication, users can switch between accounts to test different perspectives
5. **Real-time Updates**: All data refreshes after mutations to keep UI in sync

## License

This project is created for educational purposes as part of an engineering design assignment.
