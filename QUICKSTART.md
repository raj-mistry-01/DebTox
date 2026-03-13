# Quick Start Guide - DebTox

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL running locally OR remote connection string
- Google OAuth credentials (optional for testing, required for auth)

### Step 1: Backend Setup (2 min)

```bash
cd split-backend

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/split_backend
PORT=8000
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
EOF

# Install & start
npm install
npm run dev
```

**Expected output**: `Server running on port 8000`

### Step 2: Frontend Setup (2 min)

In new terminal:

```bash
cd frontend

# Create .env file
echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local

# Install & start
npm install
npm start
```

**Expected**: Expo dev server running, shows QR code

### Step 3: Test It (1 min)

```bash
# In another terminal
curl http://localhost:8000/api/v1/health
# Should return: {"status":"ok"}
```

### Step 4: Open App

- **Web**: Press `w` in Expo terminal
- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`
- **Physical Phone**: Scan QR code with Expo Go app

---

## 📋 What Works

### ✅ Already Connected to Real Backend

1. **Groups Tab**
   - Lists all user groups
   - Shows balances (owed to you / you owe)
   - Can create new groups
   - Real-time data from API

2. **Friends Tab**
   - Shows friends and balances
   - Summary of amounts
   - Can settle payments
   - Real-time data from API

3. **Activity Tab**
   - Shows expenses and payments
   - Filterable by type
   - Shows group names
   - Real-time data from API

### ⚠️ Authentication

Google Sign-In is **required**:
1. You'll be prompted to sign in with Google
2. Backend verifies the token
3. JWT token saved to phone storage
4. Automatically restored on restart

**Note**: Without Google credentials set up, sign-in will fail. Get them from [Google Cloud Console](https://console.cloud.google.com)

---

## 🔧 Common Tasks

### Database Initialization

```bash
cd split-backend
npm run db:init
```

Creates tables automatically on startup. If you need a fresh database:

```bash
# Drop all tables (use with caution!)
npm run db:init

# Or manually in PostgreSQL:
DROP DATABASE split_backend;
CREATE DATABASE split_backend;
```

### View Database

Using PostgreSQL CLI:
```bash
psql -d split_backend -U postgres

# Common queries
\dt                    -- List tables
SELECT * FROM "user";  -- View users
SELECT * FROM "group"; -- View groups
```

### Test API Endpoints

```bash
# After getting a token from app, use it:
TOKEN="your-jwt-token-here"

# List groups
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/groups

# Create expense
curl -X POST http://localhost:8000/api/v1/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": 1,
    "title": "Dinner",
    "amount": 100,
    "splits": [{"userId": 1, "shareAmount": 50}, {"userId": 2, "shareAmount": 50}]
  }'
```

### Enable Logging

Backend logs SQL queries in development. In `split-backend/.env`:

```bash
LOG_LEVEL=debug
NODE_ENV=development  # Already logs SQL
```

### Reset Everything

```bash
# Complete reset (careful!)

# 1. Kill servers (Ctrl+C both terminals)

# 2. Clean backend
cd split-backend
rm -rf node_modules package-lock.json
npm install
npm run db:init

# 3. Clean frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 4. Restart
cd split-backend && npm run dev
# In new terminal:
cd frontend && npm start
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot POST /api/v1/..." | Backend not running. Check port 8000 |
| "Unauthorized" | JWT token invalid. Re-authenticate in app |
| "connect ECONNREFUSED" | PostgreSQL not running |
| "Database not found" | Run `npm run db:init` |
| "GOOGLE_CLIENT_ID not set" | Add to split-backend/.env |
| Frontend blank screen | Check EXPO_PUBLIC_BACKEND_URL in frontend/.env.local |
| "Token expired" | Tokens valid for 7 days by default |

---

## 📚 Full Documentation

- **Integration Details**: See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Environment Setup**: See [ENV_SETUP.md](./ENV_SETUP.md)
- **Implementation Summary**: See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## 🎯 API Endpoints Quick Reference

### No Auth Required
- `GET /api/v1/health` - Health check

### Auth Required (add `Authorization: Bearer <token>` header)

**Groups**
- `POST /api/v1/groups` - Create
- `GET /api/v1/groups` - List all
- `GET /api/v1/groups/:groupId` - Get details
- `GET /api/v1/groups/:groupId/expenses` - Get expenses
- `GET /api/v1/groups/:groupId/members` - Get members

**Expenses**
- `POST /api/v1/expenses` - Create
- `GET /api/v1/expenses/:expenseId` - Get
- `DELETE /api/v1/expenses/:expenseId` - Delete

**Friends**
- `GET /api/v1/friends` - List all
- `GET /api/v1/friends/:friendId` - Get one
- `POST /api/v1/friends/:friendId/settle` - Settle payment

**Activity**
- `GET /api/v1/activity` - Get feed

**Auth**
- `POST /api/v1/auth/google` - Sign in with Google token

---

## 🚢 Ready to Deploy?

When pushing to production:

1. **Backend**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET` (40+ chars)
   - Use cloud PostgreSQL (Supabase, AWS, etc)
   - Use process manager (PM2)
   - Enable HTTPS
   - Set `GOOGLE_CLIENT_ID` for production

2. **Frontend**
   - Set `EXPO_PUBLIC_BACKEND_URL` to production domain
   - Build APK/IPA for app stores
   - Use Expo's EAS for managed builds

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for full deployment guide.

---

## 📞 Need Help?

1. Check terminal output for error messages
2. Verify all .env variables are set
3. Ensure both servers are running
4. Check database connection
5. Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed explanations

---

**Status**: ✅ Ready to use!  
**Last Updated**: March 13, 2026
