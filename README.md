# Google Trends Alert System

A real-time Google Trends monitoring system that tracks keyword popularity, detects spikes, and sends alerts via multiple channels (email, SMS, push notifications).

## Features

- 🔐 Cookie-based authentication
- 📊 Real-time trend monitoring
- 📈 Spike detection using statistical analysis
- 🔔 Multi-channel notifications (Email, SMS, Push)
- 🎯 Keyword management
- 📱 WebSocket real-time updates

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Python 3.8+
- PostgreSQL database
- Redis (optional, for caching)

## Local Setup

### 1. Clone and Install Dependencies

```bash
# Install Node.js dependencies
pnpm install
# Or if using npm:
npm install

# Install Python dependencies
pip install -r python-scrapers/requirements.txt
# Or:
python3 -m pip install -r python-scrapers/requirements.txt
```

### 2. Database Setup

Create a PostgreSQL database and set up the schema:

```bash
# Set your DATABASE_URL in .env (see below)
npx prisma migrate dev
npx prisma generate
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/google_trends_alert?schema=public"
PYTHON_DATABASE_URL="postgresql://user:password@localhost:5432/google_trends_alert?schema=public"

# JWT Secret (change this in production!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Twilio (for SMS notifications - optional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# SendGrid (for email notifications - optional)
SENDGRID_API_KEY=""

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

### 4. Run the Application

You need to run three services:

**Terminal 1 - Next.js Development Server:**
```bash
pnpm dev
```

**Terminal 2 - TypeScript Worker (spike detection):**
```bash
pnpm run worker
```
Or if using npm:
```bash
npm run worker
```

**Terminal 3 - Python Scraper (trend data fetching):**
```bash
pnpm run python-scraper
```
Or if using npm:
```bash
npm run python-scraper
```

### 5. Access the Application

- Open [http://localhost:3000](http://localhost:3000) in your browser
- Register a new account or login
- Start adding keywords to monitor

## Project Structure

- `app/` - Next.js app router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility libraries (auth, prisma, redis, etc.)
- `src/services/` - Business logic services
- `src/workers/` - Background workers
- `python-scrapers/` - Python scripts for fetching Google Trends data
- `prisma/` - Database schema and migrations

## Workflow

See [WORKFLOW.md](./WORKFLOW.md) for detailed architecture and data flow documentation.

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/keywords` - Get user's keywords
- `POST /api/keywords` - Create keyword
- `PUT /api/keywords` - Update keyword
- `DELETE /api/keywords` - Delete keyword
- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create alert
- `POST /api/trends/fetch` - Manually trigger trend analysis

## Authentication

The application uses cookie-based authentication with JWT tokens. All API routes (except auth endpoints) require authentication. The session token is stored in an HTTP-only cookie for security.

## Development

```bash
# Run linting
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs)
