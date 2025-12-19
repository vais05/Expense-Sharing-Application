# Quick Start Guide

Get your expense sharing application running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Supabase account created
- [ ] Supabase project created

## Step-by-Step Setup

### 1. Get Supabase Credentials (2 minutes)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click Settings (gear icon) → API
4. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **service_role key** (starts with `eyJ...`)

### 2. Configure Backend (1 minute)

```bash
cd server
npm install
```

Create `server/.env`:
```env
SUPABASE_URL=your_project_url_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
PORT=3001
```

### 3. Configure Frontend (1 minute)

```bash
cd ..
npm install
```

Create `.env` in root:
```env
VITE_API_URL=http://localhost:3001
```

### 4. Start the Application (1 minute)

Open TWO terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm start
```
Wait for: `Server is running on port 3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### 5. Open in Browser

Visit: [http://localhost:5173](http://localhost:5173)

---

## First-Time Usage Guide

### Create Your First Expense (3 minutes)

#### Step 1: Create Users (30 seconds)
1. In the "Create New User" section:
   - Name: `Alice`
   - Email: `alice@example.com`
   - Click "Create User"
2. Repeat for Bob and Charlie

#### Step 2: Select Current User (5 seconds)
- Use the "Current User" dropdown
- Select Alice

#### Step 3: Create a Group (20 seconds)
1. In "Create New Group":
   - Group Name: `Weekend Trip`
   - Description: `Our weekend getaway`
   - Check boxes for Bob and Charlie
   - Click "Create Group"

#### Step 4: Add an Expense (30 seconds)
1. Click on "Weekend Trip" in the groups list
2. In "Add Expense":
   - Description: `Hotel`
   - Amount: `300`
   - Split Type: `Equal Split`
   - Check Bob and Charlie
   - Click "Add Expense"

#### Step 5: View Balances (10 seconds)
1. Click the "Balances" tab
2. See who owes whom!

---

## Quick Feature Test

### Test Equal Split
```
Amount: $90
Split Type: Equal
Members: 3 people
Expected: $30 each
```

### Test Exact Split
```
Amount: $100
Split Type: Exact
Person A: $40
Person B: $35
Person C: $25
Expected: Success (adds up to $100)
```

### Test Percentage Split
```
Amount: $100
Split Type: Percentage
Person A: 50%
Person B: 30%
Person C: 20%
Expected: A pays $50, B pays $30, C pays $20
```

### Test Settlement
```
1. Note balance: "Bob owes Alice $50"
2. Switch to Bob
3. Settle Up: Pay Alice $50
4. Check balance: Should be $0
```

---

## Troubleshooting

### Backend Won't Start

**Error**: "Missing Supabase environment variables"
- **Fix**: Check `server/.env` file exists and has both SUPABASE_URL and SUPABASE_SERVICE_KEY

**Error**: "Port 3001 is already in use"
- **Fix**: Change PORT in `server/.env` to 3002 (and update frontend .env too)

**Error**: "Cannot find module 'express'"
- **Fix**: Run `npm install` in server directory

### Frontend Issues

**Error**: "Failed to fetch users"
- **Fix**: Ensure backend is running on port 3001
- **Check**: Visit [http://localhost:3001](http://localhost:3001) - should show API info

**Error**: "Network error"
- **Fix**: Check VITE_API_URL in `.env` matches backend port

### Database Issues

**Error**: "Invalid API key"
- **Fix**: Ensure you're using the **service_role** key, not the **anon** key

**Error**: "Table does not exist"
- **Fix**: The migration should have run automatically. Check Supabase dashboard → Table Editor

---

## Backend API Testing

You can test the backend directly using curl or Postman:

### Create User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

### Get All Users
```bash
curl http://localhost:3001/api/users
```

### Create Group
```bash
curl -X POST http://localhost:3001/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Group",
    "description":"Testing",
    "created_by":"USER_ID_HERE",
    "member_ids":["USER_ID_HERE"]
  }'
```

---

## Project Structure at a Glance

```
project/
├── server/               ← Backend (Express + PostgreSQL)
│   ├── controllers/      ← Business logic
│   ├── routes/          ← API endpoints
│   ├── config/          ← Database setup
│   └── index.js         ← Server entry
│
├── src/                 ← Frontend (React + TypeScript)
│   ├── components/      ← UI components
│   ├── services/        ← API calls
│   └── App.tsx          ← Main app
│
├── README.md            ← Full documentation
├── CODE_EXPLANATION.md  ← Detailed code walkthrough
└── QUICK_START.md       ← This file!
```

---

## Key Concepts Reminder

### Split Types
- **Equal**: Everyone pays the same amount
- **Exact**: You specify exact amounts (must add up to total)
- **Percentage**: You specify percentages (must add up to 100%)

### Balances
- **Group Balances**: Who owes whom in this group
- **Personal Balance**: Your overall debts/credits across all groups
- Balances are **simplified** (net amounts only)

### Settlements
- Recording a payment between two people
- Reduces the balance between them
- Doesn't delete expense history

---

## Default Ports

- **Backend**: 3001
- **Frontend**: 5173 (or next available)
- **Database**: Managed by Supabase (no local setup needed)

---

## Viewing the Backend

The backend exposes a simple info page:
- Visit: [http://localhost:3001](http://localhost:3001)
- Shows available endpoints
- Confirms backend is running

---

## Common Scenarios

### Scenario 1: Roommate Expenses
1. Create users for each roommate
2. Create group "Apartment"
3. Add expenses as they occur (groceries, utilities, etc.)
4. Check balances at end of month
5. Settle up using "Settle Up" feature

### Scenario 2: Trip Planning
1. Create users for trip members
2. Create group for the trip
3. Record expenses as they happen:
   - Hotel (paid by one person, split equally)
   - Meals (paid by different people)
   - Activities (split by percentage based on participation)
4. At end of trip, view balances
5. Everyone settles up with minimal transactions

### Scenario 3: Group Event
1. Create group for event
2. Add all expenses:
   - Venue booking
   - Catering
   - Decorations
3. Use exact split for people who didn't attend certain parts
4. Settlement phase after event

---

## Tips for Best Experience

1. **Create multiple users first** - You need at least 2 users to see interesting balances
2. **Switch users frequently** - See how the app looks from different perspectives
3. **Try all split types** - Each has different use cases
4. **Check balances often** - See how they update in real-time
5. **Use settlements** - See how they simplify balances

---

## What's Next?

After getting comfortable with the basics:

1. Read `CODE_EXPLANATION.md` to understand how everything works
2. Read `README.md` for complete feature documentation
3. Experiment with complex scenarios (multiple groups, many users)
4. Try the API endpoints directly (see Backend API Testing section)

---

## Quick Reference - API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/users | List all users |
| POST | /api/users | Create user |
| GET | /api/groups/user/:userId | User's groups |
| POST | /api/groups | Create group |
| POST | /api/expenses | Add expense |
| GET | /api/expenses/group/:groupId | Group expenses |
| GET | /api/balances/user/:userId | User balances |
| GET | /api/balances/group/:groupId | Group balances |
| POST | /api/settlements | Record payment |

---

## Environment Variables Reference

### Backend (`server/.env`)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
PORT=3001
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001
```

---

## Need Help?

1. Check `README.md` for detailed documentation
2. Check `CODE_EXPLANATION.md` for code-level details
3. Check browser console for frontend errors
4. Check terminal output for backend errors
5. Verify Supabase credentials are correct

---

**You're all set!** Start the servers and begin tracking expenses.
