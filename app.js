require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const { sequelize, testConnection } = require('./src/config/database');
const models = require('./src/models');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required when behind nginx/reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development, configure properly for production
}));
app.use(cors());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Webhook routes (MUST be before body parser for raw body access)
const webhookRoutes = require('./src/routes/webhook');
app.use('/webhooks', webhookRoutes);

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration with PostgreSQL store
app.use(session({
  store: new pgSession({
    conString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15 // Clean up expired sessions every 15 minutes
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for better UX
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./src/routes/auth');
const qrRoutes = require('./src/routes/qr');
const ingestRoutes = require('./src/routes/ingest');
const reviewRoutes = require('./src/routes/review');
const dashboardRoutes = require('./src/routes/dashboard');
const subscriptionRoutes = require('./src/routes/subscription');
const analyticsRoutes = require('./src/routes/analytics');
const adminRoutes = require('./src/routes/admin');
const uploadRoutes = require('./src/routes/uploadRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');

app.get('/', (req, res) => {
  res.render('homepage', {
    title: 'FilterFive - Turn Every Customer Into a 5-Star Google Review'
  });
});

app.get('/partners', (req, res) => {
  res.render('partners', {
    title: 'Agency Partners - FilterFive'
  });
});

// Redirect /login to /dashboard/login
app.get('/login', (req, res) => {
  res.redirect(301, '/dashboard/login');
});

// Auth Routes (Public signup, verification, password reset)
app.use('/', authRoutes);

// QR Code Routes (Public QR code feedback)
app.use('/', qrRoutes);

// API Routes
app.use('/api/v1/hooks', ingestRoutes);

// Review Routes (Customer-facing)
app.use('/review', reviewRoutes);

// Dashboard Routes (Tenant-facing)
app.use('/dashboard', dashboardRoutes);

// Subscription Routes (Tenant-facing)
app.use('/dashboard/subscription', subscriptionRoutes);

// Analytics Routes (Tenant-facing)
app.use('/dashboard/analytics', analyticsRoutes);

// API Analytics Routes (JSON responses)
app.use('/api/analytics', analyticsRoutes);

// Upload Routes (CSV upload - Tenant-facing)
app.use('/dashboard', uploadRoutes);

// Feedback Management Routes (Tenant-facing)
app.use('/dashboard', feedbackRoutes);

// Admin Routes (Super Admin only)
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Initialize cron jobs
const { initDailySnapshotsCron } = require('./src/cron/daily-snapshots');

// Database connection and server start
const startServer = async () => {
  try {
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('Failed to connect to database. Server not started.');
      process.exit(1);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);

      // Initialize cron jobs
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
        console.log('✓ Initializing cron jobs...');
        initDailySnapshotsCron();
        console.log('✓ Cron jobs initialized');
      } else {
        console.log('⚠ Cron jobs disabled (set ENABLE_CRON=true to enable in development)');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
