# split-backend

Backend API for Smart Expense Splitting and Settlement.

## Implemented

- Express API with versioned routes under /api/v1
- Google Sign-In endpoint using Google ID token verification
- JWT-based auth middleware
- PostgreSQL schema using Sequelize models with strong constraints and indexes
- Group create and list endpoints to validate auth + schema flow

## Data Models

- user
- group
- group_member
- expense
- expense_share
- balance
- payment

The schema includes:

- Foreign key relationships
- Unique constraints for identity and membership
- ENUM constraints for role/split/payment statuses
- Composite indexes for common financial query patterns

## API Endpoints

- GET /api/v1/health
- POST /api/v1/auth/google
- POST /api/v1/groups (Bearer token required)
- GET /api/v1/groups/me (Bearer token required)

## Quick Start

1. Install dependencies:
   npm install
2. Fill .env with valid PostgreSQL and Google client values.
3. Run server:
   npm run dev

## Google Auth Request

POST /api/v1/auth/google

Body:

{
  "idToken": "GOOGLE_ID_TOKEN_FROM_FRONTEND"
}

Returns:

- accessToken (JWT)
- user profile
