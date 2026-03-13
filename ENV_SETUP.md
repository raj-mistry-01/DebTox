# Environment Variables Guide

## Backend Configuration (.env)

Located in: `split-backend/.env`

```bash
# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# Option 1: Using single connection string (recommended for cloud DBs)
DATABASE_URL=postgresql://user:password@host:port/database_name

# Option 2: Using individual config (recommended for local dev)
DB_NAME=split_backend
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# ==========================================
# SERVER CONFIGURATION  
# ==========================================

PORT=8000
NODE_ENV=development  # Set to 'production' for deployment

# ==========================================
# JWT AUTHENTICATION
# ==========================================

# IMPORTANT: Change this to a strong random string!
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# How long tokens are valid
JWT_EXPIRES_IN=7d  # Options: '24h', '7d', '30d'

# ==========================================
# GOOGLE OAUTH CONFIGURATION
# ==========================================

# Get from: https://console.cloud.google.com/apis/dashboard
# 1. Create project
# 2. Enable Google+ API
# 3. Create OAuth 2.0 credentials
# 4. Add authorized redirect URIs
# 5. Copy Client ID here

GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

```

## Frontend Configuration (.env.local)

Located in: `frontend/.env.local`

```bash
# ==========================================
# BACKEND API CONFIGURATION
# ==========================================

# Development (points to your local backend)
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000

# Production (points to deployed backend)
# EXPO_PUBLIC_BACKEND_URL=https://api.example.com

```

## Quick Setup Script

### MacOS/Linux

```bash
#!/bin/bash

# Backend setup
cd split-backend
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/split_backend
PORT=8000
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
EOF

# Frontend setup
cd ../frontend
cat > .env.local << EOF
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EOF

echo "✅ Environment files created!"
echo "⚠️  Update GOOGLE_CLIENT_ID in split-backend/.env"
```

### Windows (PowerShell)

```powershell
# Backend setup
cd split-backend
@"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/split_backend
PORT=8000
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
"@ | Out-File -Encoding UTF8 .env

# Frontend setup
cd ../frontend
@"
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
"@ | Out-File -Encoding UTF8 .env.local

Write-Host "✅ Environment files created!"
Write-Host "⚠️  Update GOOGLE_CLIENT_ID in split-backend/.env"
```

## Environment Variable Reference

### Backend Variables Explained

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `postgresql://...` | ✅ | Full connection string for PostgreSQL |
| `DB_NAME` | `split_backend` | ⚠️ (if no URL) | Database name (when using individual config) |
| `DB_USER` | `postgres` | ⚠️ (if no URL) | Database user (when using individual config) |
| `DB_PASSWORD` | `secure_pass` | ⚠️ (if no URL) | Database password (when using individual config) |
| `DB_HOST` | `localhost` | ⚠️ (if no URL) | Database host (when using individual config) |
| `DB_PORT` | `5432` | ⚠️ (if no URL) | Database port (when using individual config) |
| `PORT` | `8000` | ❌ | Server port (default: 8000) |
| `NODE_ENV` | `development` | ❌ | Environment (default: development) |
| `JWT_SECRET` | `random-string` | ✅ | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | ❌ | Token expiration time (default: 7d) |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | ✅ | Google OAuth Client ID |

### Frontend Variables Explained

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | `http://localhost:8000` | ✅ | Backend API base URL |

**Note**: Frontend variables must start with `EXPO_PUBLIC_` to be accessible

## Database Connection Strings

### PostgreSQL Local (Development)
```
postgresql://postgres:password@localhost:5432/split_backend
postgresql://username:password@127.0.0.1:5432/split_backend
```

### PostgreSQL Supabase (Cloud)
```
postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
```

### PostgreSQL AWS RDS (Cloud)
```
postgresql://admin:password@db-instance-1.xxxxx.us-east-1.rds.amazonaws.com:5432/split_backend
```

### PostgreSQL Docker (Development)
```
postgresql://postgres:postgres@postgres:5432/split_backend
```

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Create Project"
3. Name: "DebTox"
4. Select project
5. Go to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "OAuth 2.0 Client IDs"
7. Choose "Web application"
8. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:8081`
   - Your production domain
9. Copy the "Client ID" to `GOOGLE_CLIENT_ID`

## Generating JWT_SECRET

**Never use default value!**

### On Linux/MacOS
```bash
openssl rand -base64 32
# Output: xB4kL9mP2qR7nT1vW8cX3zH5yJ0dF6gE...
```

### On Windows (PowerShell)
```powershell
$bytes = [System.Byte[]]::new(32)
$random = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$random.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Online (not recommended for production)
Use any online base64 generator or similar random string generator

## Environment by Context

### Local Development
```bash
# Backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/split_backend
NODE_ENV=development
JWT_SECRET=dev-secret-change-this
GOOGLE_CLIENT_ID=your-dev-client-id

# Frontend  
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Testing (CI/CD)
```bash
# Backend
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/split_backend
NODE_ENV=test
JWT_SECRET=ci-secret
GOOGLE_CLIENT_ID=test-client-id

# Frontend
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Staging
```bash
# Backend
DATABASE_URL=postgresql://...staging-db...
NODE_ENV=staging
JWT_SECRET=staging-secret-strong
GOOGLE_CLIENT_ID=staging-client-id

# Frontend
EXPO_PUBLIC_BACKEND_URL=https://api-staging.example.com
```

### Production
```bash
# Backend
DATABASE_URL=postgresql://...production-db...
NODE_ENV=production
JWT_SECRET=production-secret-very-strong
GOOGLE_CLIENT_ID=production-client-id
PORT=3000  # or via reverse proxy

# Frontend
EXPO_PUBLIC_BACKEND_URL=https://api.example.com
```

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify credentials are right
- Check firewall allows port 5432

### "JWT_SECRET not set"
- Backend requires JWT_SECRET
- Add it to .env file
- Don't commit .env to version control

### "Frontend can't reach backend"
- Check EXPO_PUBLIC_BACKEND_URL
- Ensure backend is running
- On physical device, use IP not localhost
- Check firewall

### "Google sign-in fails"
- Verify GOOGLE_CLIENT_ID
- Check it matches your Google Console project
- In development, Google might need localhost redirect URI

### "Token expires too quickly"
- Change JWT_EXPIRES_IN to longer duration
- Common values: '1d', '7d', '30d'
- Note: Tokens can't be refreshed in current setup

## Best Practices

1. **Never commit .env files**
   ```bash
   # Add to .gitignore
   *.env
   .env.local
   ```

2. **Use strong JWT_SECRET**
   - Minimum 32 characters
   - Random characters/symbols
   - Different for each environment

3. **Rotate secrets periodically**
   - Change JWT_SECRET quarterly
   - Update Google credentials annually
   - Use secret management services in production

4. **Environment-specific configs**
   - Different DB for dev/staging/prod
   - Different Google client IDs per environment
   - Different JWT expiration times

5. **Use environment management tools**
   - dotenv (Node.js) ✅ Already used
   - direnv (shells)
   - AWS Secrets Manager (cloud)
   - Vault (enterprise)

## Validation Checklist

Before starting app:

- [ ] Backend .env has DATABASE_URL or all DB_* vars
- [ ] Backend .env has JWT_SECRET
- [ ] Backend .env has GOOGLE_CLIENT_ID
- [ ] Frontend .env.local has EXPO_PUBLIC_BACKEND_URL
- [ ] DATABASE_URL points to running PostgreSQL
- [ ] JWT_SECRET is different from examples
- [ ] GOOGLE_CLIENT_ID matches Google Console project
- [ ] Backend starts without errors: `npm run dev`
- [ ] Frontend starts without errors: `npm start`
