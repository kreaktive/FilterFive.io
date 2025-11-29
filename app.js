require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
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

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./src/routes/auth');
const ingestRoutes = require('./src/routes/ingest');
const reviewRoutes = require('./src/routes/review');
const dashboardRoutes = require('./src/routes/dashboard');
const adminRoutes = require('./src/routes/admin');
const uploadRoutes = require('./src/routes/uploadRoutes');

app.get('/', (req, res) => {
  res.send('FilterFive API - Server is running');
});

// Auth Routes (Public signup, verification, password reset)
app.use('/', authRoutes);

// API Routes
app.use('/api/v1/hooks', ingestRoutes);

// Review Routes (Customer-facing)
app.use('/review', reviewRoutes);

// Dashboard Routes (Tenant-facing)
app.use('/dashboard', dashboardRoutes);

// Upload Routes (CSV upload - Tenant-facing)
app.use('/dashboard', uploadRoutes);

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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
