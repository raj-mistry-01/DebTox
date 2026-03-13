# DebTox Backend-Frontend Integration Guide

## Overview
This document describes the complete integration between the Expo/React Native frontend and Express.js backend for the DebTox expense-splitting application.

## What Changed

### Backend Changes (split-backend/)

#### New Controllers Created
1. **expense.controller.js** - Handles expense creation, retrieval, and deletion
   - `createExpense()` - Creates expense with automatic balance calculations
   - `getExpense()` - Retrieves single expense details
   - `deleteExpense()` - Deletes expense and reverses balances

2. **balance.controller.js** - Handles friend/balance relationships
   - `getFriends()` - Lists all friends with aggregated balances
   - `getFriend()` - Gets specific friend details and balance
   - `settlePayment()` - Records payment and updates balances

3. **activity.controller.js** - Handles activity feed
   - `getActivity()` - Returns user's expense and payment activity

#### Expanded Controllers
- **group.controller.js** - Added methods:
   - `getGroupDetails()` - Get group info, members, and expenses
   - `getGroupExpenses()` - List expenses in a group
   - `getGroupMembers()` - List group members

#### New Routers
- `expense.router.js` - Routes for `/api/v1/expenses`
- `balance.router.js` - Routes for `/api/v1/friends`
- `activity.router.js` - Routes for `/api/v1/activity`

#### Updated Main Router
- Added all new routers to `/api/v1` namespace
- All endpoints require Bearer token authentication

### Frontend Changes (frontend/)

#### New Service Layer
1. **services/api.ts** - API client class
   - Centralized HTTP requests with authentication
   - DRY principle - single token management
   - All endpoints configured in one place

2. **services/storage.ts** - Token persistence
   - Uses AsyncStorage for secure token storage
   - Functions to save/retrieve/clear tokens and user data

#### Enhanced AuthContext (context/AuthContext.tsx)
- Integrates real Google OAuth authentication
- Persists JWT tokens to AsyncStorage
- Auto-restore on app launch
- Added `isLoading` state for better UX
- Added `googleSignIn()` method for OAuth flow
- Added `restoreToken()` for app initialization

#### New API Hooks (hooks/useApi.ts)
1. `useGroups()` - Fetches and manages groups list
2. `useGroup()` - Fetches single group details
3. `useExpenses()` - Fetches group expenses
4. `useFriends()` - Fetches friends with balances
5. `useActivity()` - Fetches activity feed

#### Updated Screens
1. **Groups Tab** - Now fetches real data
   - Displays dynamic balances from API
   - Refresh on screen focus
   - Loading states
   - Error handling with retry

2. **Friends Tab** - Now fetches real data
   - Displays friend balances from API
   - Dynamic summary calculation
   - Refresh on screen focus

3. **Activity Tab** - Now fetches real data
   - Shows real expense and payment activity
   - Filterable by type
   - Loading and error states

## API Endpoints

### Authentication
- `POST /api/v1/auth/google` - Google OAuth sign-in

### Groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups` - List user's groups
- `GET /api/v1/groups/:groupId` - Get group details
- `GET /api/v1/groups/:groupId/expenses` - Get group expenses
- `GET /api/v1/groups/:groupId/members` - Get group members

### Expenses
- `POST /api/v1/expenses` - Create expense
- `GET /api/v1/expenses/:expenseId` - Get expense details
- `DELETE /api/v1/expenses/:expenseId` - Delete expense

### Friends & Balances
- `GET /api/v1/friends` - List friends with balances
- `GET /api/v1/friends/:friendId` - Get friend details
- `POST /api/v1/friends/:friendId/settle` - Record payment/settlement

### Activity
- `GET /api/v1/activity` - Get user activity feed

## Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://user:password@host:port/database
# OR individual config:
DB_NAME=split_backend
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Server
PORT=8000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
```

### Frontend (.env.local)
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

For production, update to your backend URL.

## Setup Instructions

### Backend Setup

1. **Install dependencies**
   ```bash
   cd split-backend
   npm install
   ```

2. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env with your database and JWT credentials
   ```

3. **Initialize database**
   ```bash
   npm run db:init
   ```

4. **Start server**
   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

   Server will run on `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create .env.local file**
   ```bash
   echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local
   ```

3. **Start Expo development server**
   ```bash
   npm start
   ```

   Then:
   - Press `w` for web
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on phone

## Data Flow

### User Authentication Flow
1. User taps "Sign in with Google"
2. Frontend obtains Google ID token
3. Frontend sends idToken to `POST /api/v1/auth/google`
4. Backend verifies token with Google
5. Backend creates/updates user in database
6. Backend returns JWT access token
7. Frontend stores JWT in AsyncStorage
8. Frontend sets JWT in ApiClient for all future requests
9. On app restart, frontend restores JWT from storage

### Expense Creation Flow
1. User fills form in expense creation screen
2. Frontend calls `apiClient.createExpense()`
3. Backend validates expense within transaction
4. Backend creates expense record
5. Backend creates ExpenseShare records for each person
6. Backend calculates and updates Balance records
7. Backend returns formatted expense data
8. Frontend updates UI with real data

### Data Display Flow
1. Screen mounts or receives focus
2. Hook's useEffect triggers `refetch()`
3. Frontend fetches from API using ApiClient
4. Backend queries database and formats response
5. Frontend stores data in hook state
6. Hook updates causes screen re-render with new data
7. Loading state shows during fetch
8. Error state shows if fetch fails

## Key Implementation Details

### Transaction Safety
- Expense creation uses database transactions
- All balance updates happen atomically
- If any step fails, entire transaction rolls back

### Authentication Pattern
- All protected endpoints check JWT token
- `requireAuth` middleware validates token
- Token payload includes user ID (sub)
- User ID extracted from token, not from request body

### Balance Calculation
- Balances are stored as: "who owes who how much"
- Positive balance = friend owes current user
- Negative balance = current user owes friend
- Balances update when expenses created/deleted
- Balances decrease when payments made

### Response Formatting
- Backend formats all responses to match frontend types
- User IDs are kept as numbers from database
- Frontend treats IDs as either string or number
- Currency always in decimal format (2 places)
- Dates always in ISO 8601 format

## Response Examples

### Create Expense
```json
{
  "message": "Expense created",
  "expense": {
    "id": 42,
    "groupId": 1,
    "description": "Dinner",
    "amount": 100,
    "currency": "INR",
    "paidBy": {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com"
    },
    "splitWith": [
      {
        "user": {"id": 2, "name": "Bob", "email": "bob@example.com"},
        "share": 50
      }
    ],
    "date": "2026-03-13T10:30:00Z",
    "category": "Food & Drink"
  }
}
```

### Get Friends
```json
{
  "friends": [
    {
      "id": "friend-2",
      "user": {"id": 2, "name": "Bob", "email": "bob@example.com"},
      "balance": 50
    }
  ]
}
```

## Testing Endpoints

### Using curl

```bash
# Get health check
curl http://localhost:8000/api/v1/health

# Google sign-in (requires real Google idToken)
curl -X POST http://localhost:8000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<real-token>"}'

# Create group (requires token)
curl -X POST http://localhost:8000/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Trip"}'

# List groups
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/groups
```

## Database Schema

### Key Relationships
- User (1) -> (many) Group (as creator)
- Group (1) -> (many) GroupMember
- GroupMember (many) -> (many) User
- Group (1) -> (many) Expense
- Expense (many) -> (many) ExpenseShare
- ExpenseShare -> User (paid by whom)
- Group (1) -> (many) Balance
- Group (1) -> (many) Payment

### Important Fields
- User.id - Auto-incrementing BIGINT primary key
- GroupMember: Unique constraint on (groupId, userId)
- Expense: Uses DECIMAL(12,2) for precise currency
- Balance: Unique constraint on (groupId, fromUserId, toUserId)
- All timestamps auto-populated with UTC

## Troubleshooting

### Frontend not connecting to backend
1. Check EXPO_PUBLIC_BACKEND_URL env var
2. Ensure backend is running on correct port
3. Check network connectivity (use IP if on physical device)
4. Test with `npm run health` or curl as shown above

### Database connection failed
1. Check DATABASE_URL or individual DB credentials
2. Ensure PostgreSQL is running
3. Verify database exists (or modify .env to create it)
4. Check firewall allowing port 5432

### JWT token expired/invalid
1. Clear app data and re-authenticate
2. Check JWT_SECRET matches between frontend calls
3. Token expires after JWT_EXPIRES_IN (default 7 days)

### CORS issues (if frontend and backend on different domains)
1. Backend already has JSON body parsing enabled
2. For cross-origin requests, add CORS middleware to backend:
   ```javascript
   import cors from 'cors';
   app.use(cors());
   ```

## Next Steps / Future Enhancements

1. **Group Modifications**
   - Add members to group
   - Remove members from group
   - Delete group

2. **Expense Modifications**
   - Edit expense details
   - Change split percentages
   - Mark as settled

3. **Better Error Handling**
   - Specific error codes for different failure types
   - Retry logic with exponential backoff on frontend
   - Error logging/monitoring

4. **Performance**
   - Add pagination to activity feed
   - Add caching for groups/friends
   - Implement infinite scroll

5. **Real Payment Integration**
   - Integrate with SETU UPI gateway
   - Store payment receipts
   - Auto-settle payments

6. **Notifications**
   - Push notifications for payments received
   - Email notifications for group invitations
   - In-app notification center

## Files Modified Summary

```
Backend:
✅ src/controller/group.controller.js (expanded)
✅ src/controller/expense.controller.js (created)
✅ src/controller/balance.controller.js (created)
✅ src/controller/activity.controller.js (created)
✅ src/router/group.router.js (updated)
✅ src/router/expense.router.js (created)
✅ src/router/balance.router.js (created)
✅ src/router/activity.router.js (created)
✅ src/router/index.js (updated)

Frontend:
✅ services/api.ts (created)
✅ services/storage.ts (created)
✅ hooks/useApi.ts (created)
✅ context/AuthContext.tsx (updated)
✅ app/(tabs)/groups.tsx (updated)
✅ app/(tabs)/friends.tsx (updated)
✅ app/(tabs)/activity.tsx (updated)
```

## Support & Questions

For questions about the integration:
1. Check API response formats in this guide
2. Review the example curl requests
3. Check console logs for detailed error messages
4. Ensure all environment variables are set correctly
