# Google Trends Alert System

Track Google Trends keywords and get email alerts when they spike in popularity.

## Features

- 🔐 User login
- 📊 Track keyword popularity
- 📈 Detect when keywords spike
- 🔔 Email alerts
- 🎯 Manage your keywords

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

Set up your database:

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

# Email Settings (Required for email alerts)
# If not set up, emails won't be sent (test mode only)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# For Gmail: You need to generate an "App Password" in your Google Account settings
# Go to: Google Account > Security > 2-Step Verification > App passwords

# Twilio (for SMS notifications - optional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

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

**Terminal 2 - Worker (checks for spikes and sends emails):**
```bash
pnpm run worker
```
Or if using npm:
```bash
npm run worker
```

> **Important:** You must run the worker for emails to work! It checks for spikes and sends emails automatically.

**Terminal 3 - Python Scraper (gets trend data):**
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
- Create alerts with email notifications enabled

## Email Setup

### Gmail Setup

1. Turn on 2-Step Verification in your Google Account
2. Create an App Password:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Click: Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Copy the password

3. Add to your `.env` file:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   EMAIL_FROM="your-email@gmail.com"
   ```

### Other Email Providers

**Outlook:**
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

**Yahoo:**
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

**Note:** If you don't set up email, the system will use test mode (emails won't actually be sent, but you'll see preview links in the console).

## Troubleshooting

### Emails Not Working?

1. **Is the worker running?**
   - Open a terminal and run: `pnpm run worker`
   - You should see: `🚀 TREND MONITOR WORKER STARTED`
   - If not running, emails won't be sent

2. **Check your email settings:**
   - Make sure all email settings are in your `.env` file
   - For Gmail, use an App Password (not your regular password)
   - Check the worker console for email messages

3. **Check the logs:**
   - Look for `🚨 SPIKE DETECTED` when a spike happens
   - Look for `📧 Email sent successfully` when email works
   - Look for `❌ Email failed` if there's a problem

4. **Common issues:**
   - Email settings missing → Add them to `.env`
   - Wrong password → Use Gmail App Password
   - Worker not running → Start it with `pnpm run worker`
   - Thresholds too high → Lower your alert thresholds

## Project Structure

- `app/` - Web pages and API
- `src/components/` - UI components
- `src/lib/` - Helper functions
- `src/services/` - Core services (email, etc.)
- `src/workers/` - Background worker for checking spikes
- `python-scrapers/` - Scripts that get Google Trends data
- `prisma/` - Database setup

## How It Works

1. **Python Scraper** - Gets Google Trends data and saves it to the database every 5 minutes

2. **Worker** - Checks for spikes every 30 seconds and sends emails when spikes are found

3. **Web App** - Lets you create alerts and see your data

### Spike Detection

The system watches for sudden increases in keyword popularity:
- Compares current popularity to the average over the last 14 days
- Sends an alert when there's a big jump
- Shows how severe the spike is: low, medium, high, or critical


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

Uses secure cookies for login. You need to be logged in to use most features.

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

### Development Tips

- Check worker console for detailed logs
- Without email setup, check console for email preview links
- View database: `npx prisma studio`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs)
