const express = require('express');
const router = express.Router();
const { receiveCustomerData } = require('../controllers/ingestController');

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required'
    });
  }

  if (apiKey !== process.env.API_SECRET) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

// POST /api/v1/hooks/customer
router.post('/customer', authenticateApiKey, receiveCustomerData);

module.exports = router;
