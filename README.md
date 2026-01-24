# Pulse Productions - Prom Booking Platform

A production-ready prom ticket booking system with manual bank transfer verification, QR code generation, and admin dashboard.

## Features

- ✅ Browse and select from multiple proms
- ✅ 3 ticket types per prom (Lounge, VIP, Standing) with different prices
- ✅ No-login checkout flow
- ✅ Bank transfer payment with unique reference codes
- ✅ Payment proof upload (images/PDF)
- ✅ Admin dashboard for payment verification
- ✅ QR code generation for tickets
- ✅ Email notifications (order confirmation & tickets)
- ✅ Secure admin authentication
- ✅ Responsive, mobile-first UI

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API
- **Prisma** - Type-safe ORM
- **SQLite** - Database (easily switchable to PostgreSQL)
- **JWT** - Admin authentication
- **Multer** - File uploads
- **QRCode** - QR code generation
- **Nodemailer** - Email service

### Frontend
- **React** + **Vite** - Modern UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
tickets/
├── backend/
│   ├── config/          # Database, bank config
│   ├── middleware/      # Auth, upload validation
│   ├── routes/          # API endpoints
│   ├── services/        # Email, tickets, QR codes
│   ├── utils/           # Helper functions
│   ├── prisma/          # Database schema & migrations
│   ├── uploads/          # Payment proof files
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── api/          # API client
│   │   └── App.jsx       # Main app
│   └── vite.config.js
└── package.json          # Root workspace config
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git

### 1. Install Dependencies

```bash
npm run setup
```

This will:
- Install root dependencies
- Install backend dependencies
- Generate Prisma client
- Install frontend dependencies

### 2. Configure Environment

Copy the example env file and update with your settings:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and configure:
- **SMTP settings** (for email notifications)
- **Bank details** (for bank transfer instructions)
- **JWT_SECRET** (change in production!)

### 3. Initialize Database

```bash
cd backend
npm run db:migrate
npm run db:seed
```

This creates:
- Database tables
- 4 sample proms (EBIS Prom, AIS, CES, NIS)
- Admin user: `admin@pulse.com` / `admin123`

### 4. Create Uploads Directory

```bash
cd backend
mkdir uploads
```

### 5. Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

Or start separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## API Endpoints

### Public Endpoints

- `GET /api/proms` - List all active proms
- `GET /api/proms/:id` - Get prom details
- `POST /api/orders` - Create new order
- `GET /api/orders/:referenceCode` - Get order by reference
- `POST /api/upload/payment-proof/:orderId` - Upload payment proof

### Admin Endpoints (Requires JWT)

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/orders` - List orders (with filters)
- `GET /api/admin/orders/:id` - Get order details
- `POST /api/admin/orders/:id/verify` - Approve payment & generate tickets
- `POST /api/admin/orders/:id/reject` - Reject payment
- `GET /api/admin/stats` - Dashboard statistics

## User Flow

1. **Browse Proms** - User sees list of available proms
2. **Select Prom** - User clicks on a prom to see ticket types
3. **Choose Tickets** - User selects quantities for Lounge/VIP/Standing
4. **Checkout** - User enters name, email, phone (no login required)
5. **Bank Transfer** - System displays bank details with unique reference code
6. **Upload Proof** - User uploads payment screenshot/PDF
7. **Admin Review** - Admin views payment proof in dashboard
8. **Verification** - Admin approves/rejects payment
9. **Tickets Generated** - On approval, QR codes are generated
10. **Email Sent** - Customer receives tickets via email

## Admin Dashboard

Access at: http://localhost:5173/admin/login

**Default Credentials:**
- Email: `admin@pulse.com`
- Password: `admin123`

**Features:**
- View all orders with status filters
- See payment proofs
- Approve/reject payments
- View dashboard statistics
- Generate tickets on approval

## Database Schema

- **Prom** - Prom events
- **TicketType** - Ticket types (Lounge, VIP, Standing) per prom
- **Order** - Customer orders
- **OrderItem** - Items in each order
- **PaymentProof** - Uploaded payment proof files
- **Ticket** - Generated tickets with QR codes
- **AdminUser** - Admin accounts

## Security Features

- ✅ JWT-based admin authentication
- ✅ File upload validation (type, size)
- ✅ Unique, non-guessable reference codes
- ✅ Secure QR code generation
- ✅ Input validation on all endpoints
- ✅ CORS configuration
- ✅ Environment variable secrets

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite
3. Configure proper SMTP credentials
4. Set strong `JWT_SECRET`
5. Use HTTPS
6. Configure file storage (S3, etc.)
7. Set up proper logging

### Frontend
1. Build: `npm run build:frontend`
2. Serve static files (Nginx, Vercel, etc.)
3. Update `VITE_API_URL` to production API

## Email Configuration

The system sends two types of emails:

1. **Order Confirmation** - Sent when order is created (includes bank details)
2. **Tickets Email** - Sent when payment is verified (includes QR codes)

Configure SMTP in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Pulse Productions <noreply@pulseproductions.com>
```

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).

## Troubleshooting

**Database issues:**
```bash
cd backend
npx prisma migrate reset  # Reset database
npm run db:seed            # Re-seed data
```

**Port conflicts:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

**Email not sending:**
- Check SMTP credentials in `.env`
- System will continue working even if email fails (logged to console)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
