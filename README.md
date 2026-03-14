# DebTox 💸 

*Simplify expense splitting and debt settlement with friends and groups*

[![Backend Deploy](https://img.shields.io/badge/Backend-Vercel-green?style=flat-square)](https://deb-tox-olive.vercel.app)
[![Frontend Build](https://img.shields.io/badge/Frontend-Expo-blue?style=flat-square)](https://expo.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#license)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)]()
[![React Native](https://img.shields.io/badge/React%20Native-Latest-blue?style=flat-square)]()

## 📋 Overview

DebTox is a full-stack expense-splitting application that helps groups and friends track shared expenses, calculate individual debts, and settle payments seamlessly. With intelligent debt simplification, UPI/cash payment integration, and real-time notifications, managing shared finances has never been easier.

## ✨ Key Features

- **Smart Expense Splitting** — Add expenses to groups, split equally or custom amounts
- **Intelligent Debt Simplification** — Graph algorithm reduces complex debt chains to minimum transactions
- **Dual Payment Integration** — UPI payment via UroPay QR codes or record cash payments
- **Friend Management** — Add friends outside groups, track peer-to-peer balances
- **Real-Time Notifications** — Push alerts for payments, friend requests, and balance updates
- **Payment Receipts** — Email confirmations for all payment transactions
- **Multi-Currency Support** — Handle expenses in different currencies per group
- **Account Dashboard** — View live stats (groups, friends, expenses) with profile management
- **Dark Theme UI** — Modern, accessible interface with consistent dark theme
- **Cloud Database** — Supabase PostgreSQL for reliable data persistence

## 📸 User Interface

### Screenshots & Screens

| Screen | Description |
|--------|-------------|
| **Authentication** | Login, Sign Up with email or Google OAuth |
| **Home/Dashboard** | Quick stats - Groups, Friends, Expenses, Account profile |
| **Groups** | Create groups, view members, list expenses within group |
| **Expenses** | Add expense, split method selection, category selection |
| **Friends** | Friend list, friend requests, add new friends, peer balances |
| **Settlement** | Choose payment method (UPI QR / Cash), verify payment, confirmation |
| **Notifications** | Real-time payment alerts, friend request notifications |
| **Account** | Profile management, UPI ID, stats, settings |

refer to ui folder for screenshots

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native + Expo | Cross-platform mobile app |
| **Backend** | Node.js + Express | REST API server |
| **Database** | PostgreSQL (Supabase) | Cloud data storage |
| **Auth** | JWT + Google OAuth | Secure authentication |
| **Payments** | UroPay API | UPI payment gateway |
| **Email** | Nodemailer | Transaction receipts |
| **Deployment** | Vercel (Backend), EAS (Mobile) | Cloud hosting |

### System Design

```
Frontend (React Native)
    ↓
Backend API (Node.js/Express)
    ├── Auth Controller (JWT + Google)
    ├── Group Controller (CRUD)
    ├── Expense Controller (Splitting)
    ├── Payment Controller (UPI + Cash)
    ├── Friend Controller (Requests)
    ├── Balance Controller (Debt Tracking)
    └── Notification Service
    ↓
Database (Supabase PostgreSQL)
    ├── Users
    ├── Groups & GroupMembers
    ├── Expenses & ExpenseShares
    ├── Balances
    ├── Payments
    ├── Friends
    └── Notifications
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Supabase cloud)
- Android SDK (for APK builds)
- Expo CLI

### Backend Setup

```bash
cd split-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL, JWT_SECRET, UroPay keys, Gmail credentials

# Start development server
npm run dev
# Server runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Update API endpoint in services/api.ts
# Change BACKEND_URL to your deployed backend URL

# Run on Android emulator
npm run android

# Build APK for testing
eas build -p android --profile preview
```

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://...@supabase.com

# JWT & Auth
JWT_SECRET=your_jwt_secret_change_in_production
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Payment Gateway
UROPAY_API_KEY=test_key
UROPAY_SECRET=test_secret
UROPAY_VPA=your_vpa@upi

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=app_password_from_gmail
```

**Frontend (services/api.ts)**
```typescript
const BACKEND_URL = 'https://your-backend.vercel.app'; // Live backend
```

## 💡 Usage Examples

### Add an Expense to Group
```typescript
await apiClient.createExpense(
  groupId='group-123',
  title='Dinner',
  amount=3000,
  splits=[
    { userId: 'user-1', shareAmount: 1500 },
    { userId: 'user-2', shareAmount: 1500 }
  ],
  currency='INR'
);
```

### Record Cash Payment
```typescript
await apiClient.recordCashPayment(
  friendId='friend-456',
  amount=500.50
);
// ✅ Balance updated, notifications sent, email receipt generated
```

### Create UPI Payment
```typescript
// 1. Generate QR code
const order = await apiClient.generateQRCode(
  amountInPaise=50000,
  note='Settle up with John',
  receiverUPI='john@ybl'
);

// 2. User scans & pays
// 3. System verifies (1-5 hidden attempts)
const verified = await apiClient.checkPaymentStatus(orderId);

// 4. Finalize payment
await apiClient.finalizePayment(friendId, amount, upiTxnId, orderId);
// ✅ Balance reduced, notifications sent, email receipt sent
```

## 📊 Key API Endpoints

```
POST   /auth/signup              - Register new user
POST   /auth/signin              - Login with email/password
POST   /auth/google-signin       - Login with Google
PUT    /auth/profile             - Update user profile

POST   /groups                   - Create group
GET    /groups                   - List user's groups
GET    /groups/:id               - Get group details

POST   /expenses                 - Add expense (group or friend)
GET    /expenses/:id             - Get expense details
DELETE /expenses/:id             - Delete expense

POST   /payments/create-order    - Generate UPI QR code
POST   /payments/check-status    - Verify payment (1-5 attempts)
POST   /payments/finalize        - Record payment & update balance
POST   /payments/record-cash     - Record cash payment directly

GET    /friends                  - List friends
POST   /friends/request          - Send friend request
GET    /friends/requests         - Get pending requests
POST   /friends/requests/:id/accept - Accept request

GET    /balances                 - Get all balances
GET    /balances/:friendId       - Get friend balance

GET    /notifications            - Get notifications
GET    /notifications/unread     - Get unread count
```

## 🔧 Payment Features

### UPI Payment Flow
1. User selects friend and amount
2. System generates UroPay QR code
3. User scans and completes UPI payment
4. Mock verification system (1-5 hidden attempts) checks payment
5. System records payment, updates balance, sends notifications & email

### Cash Payment Flow
1. User selects friend and amount
2. Confirms amount
3. System immediately records payment
4. Balance updated, notifications sent
5. Email receipts sent to both users

## 🗄️ Database Schema

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **users** | User accounts | id, email, password, name, upiId |
| **groups** | Group expenses | id, name, createdBy, currency |
| **expenses** | Expense records | id, groupId, amount, title, splits |
| **balances** | Debt tracking | groupId, fromUserId, toUserId, netAmount |
| **payments** | Payment history | payerId, payeeId, amount, method, status |
| **friends** | Peer-to-peer | fromUserId, toUserId, status |
| **notifications** | Alerts | userId, type, message, isRead |


<!-- Add database schema diagram/image here -->

## 📈 Debt Simplification Algorithm

DebTox uses a **graph-based greedy algorithm** to minimize payment transactions:

```
Input: Complex debt graph
  A → B: 500, A → C: 300
  B → C: 200, B → D: 100

Output: Optimized transactions
  A → B: 200, A → C: 600  // Minimum 2 transactions instead of 4
```

## 🔐 Security

- ✅ JWT authentication with 7-day expiration
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Environment variable isolation
- ✅ Email verification for sensitive operations

## 📱 Deployment

### Backend (Vercel)
```bash
cd split-backend
vercel deploy
# Auto-deploys from github.com/raj-mistry-01/DebTox
```

### Frontend (EAS Build)
```bash
cd frontend
eas build -p android --profile preview
# Generates APK download link via internal distribution
```

## 🛠️ Development

### Local Testing
```bash
# Terminal 1: Backend
cd split-backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Android Emulator
npm run android
```

### Debug Payment System
- UPI: Mock system tests 1-5 hidden attempts before verification
- Cash: Immediate recording with email confirmation
- Check logs: All transactions logged to console with timestamps

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- UroPay for payment gateway integration
- Supabase for PostgreSQL hosting
- Expo & EAS for mobile build infrastructure
- Vercel for backend deployment

---

# Team - FinTech Capital