# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Setup Backend
```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env and configure:
# - SMTP settings (for emails)
# - Bank details
# - JWT_SECRET (change this!)

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed database with sample data
npm run db:seed

# Create uploads directory
mkdir uploads

cd ..
```

### 3. Start Development

**Option A: Run both servers together**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Login**: http://localhost:5173/admin/login
  - Email: `admin@pulse.com`
  - Password: `admin123`

## Default Data

After seeding, you'll have:
- 4 proms: EBIS Prom, AIS, CES, NIS
- Each prom has 3 ticket types: Standing, VIP, Lounge
- 1 admin user: admin@pulse.com / admin123

## Testing the Flow

1. Visit http://localhost:5173
2. Click on a prom
3. Select ticket quantities
4. Proceed to checkout
5. Enter customer details
6. Note the reference code and bank details
7. Upload a payment proof (any image/PDF)
8. Login to admin dashboard
9. View the order and verify payment
10. Tickets will be generated and emailed

## Email Setup (Optional)

To enable email notifications:

1. Edit `backend/.env`
2. Configure SMTP settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

For Gmail, create an [App Password](https://support.google.com/accounts/answer/185833).

**Note**: The system works without email configured - it will just log to console instead.

## Troubleshooting

**Port already in use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Edit `frontend/vite.config.js`

**Database errors:**
```bash
cd backend
npx prisma migrate reset
npm run db:seed
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install
cd ../frontend && npm install
```

