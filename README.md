# FilterFive

B2B SaaS reputation management tool that intercepts customer feedback via SMS.

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Templating:** EJS
- **Containerization:** Docker
- **External Services:** Twilio (SMS), Stripe (Payments), Resend (Email)

## Project Structure

```
.
├── app.js                  # Main application entry point
├── docker-compose.yml      # Docker services configuration
├── Dockerfile             # Node.js container definition
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── src/
│   ├── config/            # Configuration files
│   │   ├── database.js    # Database connection
│   │   └── migrations.js  # Database migration script
│   ├── models/            # Sequelize models
│   │   ├── index.js       # Model relationships
│   │   ├── User.js        # Tenant/Admin model
│   │   ├── FeedbackRequest.js  # SMS request tracking
│   │   └── Review.js      # Customer ratings/feedback
│   ├── controllers/       # Business logic (to be implemented)
│   ├── routes/            # API routes (to be implemented)
│   ├── middleware/        # Custom middleware (to be implemented)
│   ├── services/          # External service integrations
│   ├── utils/             # Helper functions
│   └── views/             # EJS templates
│       ├── pages/         # Full page templates
│       └── partials/      # Reusable components
└── public/                # Static assets
    ├── css/
    ├── js/
    └── images/
```

## Database Schema

### Users (Tenants/Admins)
- Email, password, business name
- Google Review Link, Facebook Link
- Subscription status (active/inactive/trial/cancelled)
- Stripe customer/subscription IDs
- Role (super_admin/tenant)

### FeedbackRequests
- **UUID** for public link (prevents ID guessing)
- Customer name, phone, email
- Status (pending/sent/clicked/rated/expired)
- SMS tracking (sent_at, clicked_at, Twilio message SID)
- Source (zapier/csv_upload/manual)

### Reviews
- Star rating (1-5)
- Feedback text
- Redirect destination (google/facebook/thank_you)
- Public flag (4-5 stars redirected externally)
- Email notification tracking

## Setup Instructions

### 1. Clone and Configure

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Start Docker Services

```bash
# Build and start containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

### 3. Run Database Migrations

```bash
# Inside the app container
docker-compose exec app npm run db:migrate

# Or if running locally
npm run db:migrate
```

### 4. Access Application

- **Application:** http://localhost:3000
- **Database:** localhost:5432

## Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run db:migrate # Sync database models
```

## Docker Commands

```bash
# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Access app container shell
docker-compose exec app sh

# Access database
docker-compose exec db psql -U postgres -d filterfive

# Rebuild after changes
docker-compose up --build
```

## Environment Variables

Required variables in `.env`:

```
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
SESSION_SECRET=your-secret-key

DB_NAME=filterfive
DB_USER=postgres
DB_PASSWORD=your-password

TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number

STRIPE_SECRET_KEY=your-key
STRIPE_PUBLISHABLE_KEY=your-key

RESEND_API_KEY=your-key
```

## Next Steps

1. Implement authentication routes and controllers
2. Create dashboard views for tenants
3. Implement SMS sending via Twilio
4. Create review capture interface (EJS views)
5. Set up Stripe subscription handling
6. Implement email notifications via Resend
7. Add Zapier webhook endpoint
8. Create CSV upload functionality

## License

Proprietary
# FiveFilter.io
