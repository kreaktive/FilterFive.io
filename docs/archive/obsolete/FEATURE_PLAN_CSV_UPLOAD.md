# CSV Upload Feature - Implementation Plan

> **Feature:** Bulk Customer Import via CSV
> **Version:** v1.2.0
> **Priority:** Medium (after Stripe integration)
> **Estimated Effort:** 2-3 days
> **Status:** 📋 Planning Phase

---

## 📋 Table of Contents

- [Feature Overview](#-feature-overview)
- [Technical Architecture](#-technical-architecture)
- [Database Design](#-database-design)
- [Implementation Roadmap](#-implementation-roadmap)
- [Code Implementation](#-code-implementation)
- [Edge Cases & Validation](#-edge-cases--validation)
- [Testing Strategy](#-testing-strategy)
- [Deployment Plan](#-deployment-plan)

---

## 🎯 Feature Overview

### Problem Statement

Tenants currently can only ingest customers via:
1. Zapier webhook (one at a time, requires Zapier account)
2. Manual entry (doesn't exist yet, would be tedious)

**Gap:** No way to import existing customer lists in bulk (e.g., 100 past customers).

### User Story

```
As a FilterFive tenant,
I want to upload a CSV file with my customer contact list,
So that I can send review requests to all my existing customers at once,
Without manually entering them one by one or setting up Zapier.
```

### Success Criteria

- ✅ Tenant can upload CSV file (max 500 rows, max 5MB)
- ✅ System validates all rows (name, phone, email)
- ✅ System detects and skips duplicates (same phone in last 30 days)
- ✅ System creates FeedbackRequests for valid rows
- ✅ System sends SMS with rate limiting (respects Twilio limits)
- ✅ Tenant sees detailed results (success count, failed count, errors)
- ✅ System logs upload history for future reference
- ✅ Process completes within 2 minutes for 500 rows

---

## 🏗 Technical Architecture

### High-Level Flow

```
┌─────────────┐
│   Tenant    │
│  Uploads    │
│  CSV File   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: File Upload & Initial Validation                   │
│  - Check file size (max 5MB)                                │
│  - Check file type (.csv only)                              │
│  - Check row count (max 500)                                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Parse CSV                                           │
│  - Read file with csv-parser                                │
│  - Extract columns: name, phone, email                      │
│  - Trim whitespace                                          │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Validate Each Row                                   │
│  - Required: name, phone                                    │
│  - Optional: email                                          │
│  - Phone format: E.164 (starts with +)                      │
│  - Email format: basic regex                                │
│  - Duplicate check: same phone in last 30 days              │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Bulk Insert FeedbackRequests                        │
│  - Transaction: insert all valid rows at once               │
│  - Generate UUID for each                                   │
│  - Set status = 'pending'                                   │
│  - Set source = 'csv_upload'                                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Send SMS in Batches (Rate Limited)                 │
│  - Queue: Array of FeedbackRequest IDs                      │
│  - Rate: 1 SMS per second (Twilio free/basic tier)         │
│  - OR: 10 SMS per second (Messaging Service)               │
│  - Update status = 'sent' after each SMS                   │
│  - Log errors for failed SMS                                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Generate Results Report                             │
│  - Total rows processed                                     │
│  - Success count (SMS sent)                                 │
│  - Failed count (validation errors, SMS failures)           │
│  - Duplicate count (skipped)                                │
│  - Detailed error list                                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Save Upload Record                                  │
│  - Table: CsvUploads                                        │
│  - Store: filename, counts, errors JSON                     │
│  - Display on dashboard                                     │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Decision: Synchronous vs Asynchronous

#### Option A: Synchronous Processing (RECOMMENDED for MVP)

**How it works:**
- HTTP request stays open during entire process
- User waits for completion (loading spinner)
- Results returned immediately

**Pros:**
- ✅ Simple implementation (no job queue needed)
- ✅ Immediate feedback to user
- ✅ No additional infrastructure
- ✅ Easy to debug

**Cons:**
- ❌ HTTP timeout risk for large files (500 rows = ~8 min at 1 SMS/sec)
- ❌ Browser could close, losing results
- ❌ Server restart would lose progress

**Recommendation:** Use this for MVP with hard limit of 500 rows and 10-minute timeout.

#### Option B: Asynchronous with Job Queue (Future Enhancement)

**How it works:**
- File uploads immediately
- Job queued in background (Bull/BullMQ/pg-boss)
- User redirected to "processing" page
- Email sent when complete

**Pros:**
- ✅ No HTTP timeout
- ✅ Server restart-safe
- ✅ Scalable to 10,000+ rows
- ✅ Better UX for large files

**Cons:**
- ❌ More complex (needs Redis or PostgreSQL job queue)
- ❌ User doesn't get immediate feedback
- ❌ Requires additional infrastructure

**Recommendation:** Add this in v1.2.1 if customers upload >500 rows regularly.

### Selected Approach: **Option A (Synchronous)** with these safeguards:

1. **Hard limit:** 500 rows max
2. **Timeout:** 10 minutes (enough for 500 SMS at 1/sec)
3. **Progress feedback:** Loading spinner with "Processing... this may take up to X minutes"
4. **Fail-safe:** If timeout occurs, partial results saved in database

---

## 🗄 Database Design

### New Table: `CsvUploads`

```sql
CREATE TABLE "CsvUploads" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "filename" VARCHAR(255) NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "validRows" INTEGER NOT NULL DEFAULT 0,
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateCount" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(50) NOT NULL DEFAULT 'processing',
    -- Status: 'processing', 'completed', 'failed', 'partial'
  "errors" JSONB,
    -- Example: [{"row": 5, "error": "Invalid phone number"}]
  "processingTimeMs" INTEGER,
    -- How long it took to process
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP
);

-- Index for querying user's upload history
CREATE INDEX idx_csvuploads_userid ON "CsvUploads"("userId", "createdAt" DESC);
```

### Sequelize Model: `CsvUpload.js`

```javascript
// src/models/CsvUpload.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CsvUpload = sequelize.define('CsvUpload', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalRows: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    validRows: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    failedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    duplicateCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'processing',
      validate: {
        isIn: [['processing', 'completed', 'failed', 'partial']]
      }
    },
    errors: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    processingTimeMs: {
      type: DataTypes.INTEGER
    },
    completedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'CsvUploads',
    timestamps: true,
    updatedAt: false
  });

  return CsvUpload;
};
```

### Model Relationships

```javascript
// src/models/index.js (add this)

CsvUpload.belongsTo(User, { foreignKey: 'userId', as: 'tenant' });
User.hasMany(CsvUpload, { foreignKey: 'userId', as: 'csvUploads' });
```

### Database Migration Script

```javascript
// src/scripts/migrateCsvUploads.js
require('dotenv').config();
const { sequelize } = require('../config/database');
const { CsvUpload } = require('../models');

const runMigration = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Create CsvUploads table
    await CsvUpload.sync({ force: false });
    console.log('✓ CsvUploads table created/verified');

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
```

---

## 🛣 Implementation Roadmap

### Phase 1: Backend Foundation (Day 1, Morning)

**Time:** 2-3 hours

1. **Install Dependencies**
   ```bash
   npm install multer csv-parser p-limit
   ```

2. **Create Database Model**
   - Create `src/models/CsvUpload.js`
   - Add relationships in `src/models/index.js`
   - Run migration to create table

3. **Create Upload Controller Skeleton**
   - Create `src/controllers/uploadController.js`
   - Add placeholder functions:
     - `showUploadPage()`
     - `processUpload()`
     - `showUploadHistory()`

4. **Add Routes**
   - Create `src/routes/uploadRoutes.js`
   - GET `/dashboard/upload` - Show upload form
   - POST `/dashboard/upload` - Process CSV
   - GET `/dashboard/uploads` - View history

---

### Phase 2: File Upload & Parsing (Day 1, Afternoon)

**Time:** 2-3 hours

1. **Configure Multer**
   - Set upload directory: `/tmp/uploads`
   - Max file size: 5MB
   - Allowed extensions: `.csv` only
   - Filename sanitization

2. **CSV Parser Implementation**
   - Read uploaded file
   - Parse columns: `name`, `phone`, `email`
   - Handle different CSV formats (comma, semicolon, tab)
   - Handle headers (case-insensitive matching)
   - Trim whitespace from all fields

3. **Initial Validation**
   - Check row count (max 500)
   - Check required columns exist
   - Create `CsvUpload` record with status='processing'

---

### Phase 3: Row Validation & Duplicate Detection (Day 2, Morning)

**Time:** 3-4 hours

1. **Validation Logic**
   - Create `src/utils/csvValidator.js`
   - Functions:
     - `validateName(name)` - Required, 2-100 chars
     - `validatePhone(phone)` - E.164 format, starts with +
     - `validateEmail(email)` - Optional, basic regex
     - `validateRow(row)` - Combines all validations

2. **Duplicate Detection**
   - Create `src/utils/duplicateChecker.js`
   - Query: Find FeedbackRequests with same phone + userId in last 30 days
   - Return: `{ isDuplicate: boolean, existingRequestId: number }`

3. **Batch Validation**
   - Loop through all rows
   - Validate each row
   - Check for duplicates
   - Separate into: `validRows`, `invalidRows`, `duplicateRows`

---

### Phase 4: Bulk Insert & SMS Sending (Day 2, Afternoon)

**Time:** 3-4 hours

1. **Bulk Insert FeedbackRequests**
   - Use `FeedbackRequest.bulkCreate()`
   - Transaction for atomicity
   - Generate UUID for each
   - Set `source = 'csv_upload'`
   - Set `status = 'pending'`

2. **Rate-Limited SMS Sending**
   - Create `src/utils/rateLimitedSms.js`
   - Use `p-limit` for concurrency control
   - Rate: 1 SMS per second (configurable)
   - Update status='sent' after each success
   - Log errors for failures

3. **Error Handling**
   - Track all errors in array
   - Continue processing even if some fail
   - Update `CsvUpload` record with final counts

---

### Phase 5: Frontend UI (Day 3, Morning)

**Time:** 2-3 hours

1. **Upload Form View** (`src/views/upload.ejs`)
   - File input with drag-and-drop
   - CSV format instructions
   - Download sample CSV template button
   - Upload button
   - Loading spinner during processing

2. **Results View**
   - Success message with counts
   - Table showing:
     - Total rows processed
     - Successful (SMS sent)
     - Failed (with errors)
     - Duplicates (skipped)
   - Detailed error list (collapsible)
   - Download errors as CSV button

3. **Upload History View** (`src/views/upload-history.ejs`)
   - Table of past uploads
   - Columns: Date, Filename, Total, Success, Failed, Duplicates, Status
   - View details button (shows errors)
   - Link from dashboard

---

### Phase 6: Testing & Bug Fixes (Day 3, Afternoon)

**Time:** 2-3 hours

1. **Test Cases** (see Testing Strategy section below)
2. **Bug fixes**
3. **Performance optimization**
4. **User experience improvements**

---

## 💻 Code Implementation

### 1. Upload Controller (`src/controllers/uploadController.js`)

```javascript
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit');
const { FeedbackRequest, CsvUpload } = require('../models');
const { validateRow, isDuplicatePhone } = require('../utils/csvValidator');
const { sendSMS } = require('../services/smsService');
const { v4: uuidv4 } = require('uuid');

// Configure multer
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// GET /dashboard/upload - Show upload form
const showUploadPage = async (req, res) => {
  try {
    res.render('upload', {
      title: 'Upload Customers',
      user: req.user
    });
  } catch (error) {
    console.error('Upload page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load upload page',
      error: { status: 500 }
    });
  }
};

// POST /dashboard/upload - Process CSV
const processUpload = async (req, res) => {
  const startTime = Date.now();
  let uploadRecord = null;
  let uploadedFilePath = null;

  try {
    // Get uploaded file
    if (!req.file) {
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: req.user,
        error: 'No file uploaded. Please select a CSV file.'
      });
    }

    uploadedFilePath = req.file.path;
    const filename = req.file.originalname;

    console.log(`Processing CSV upload: ${filename} for user ${req.user.id}`);

    // Parse CSV
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(uploadedFilePath)
        .pipe(csv({
          mapHeaders: ({ header }) => header.toLowerCase().trim()
        }))
        .on('data', (row) => {
          rows.push({
            name: row.name?.trim() || row.customer_name?.trim() || '',
            phone: row.phone?.trim() || row.customer_phone?.trim() || '',
            email: row.email?.trim() || row.customer_email?.trim() || ''
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Check row count
    if (rows.length === 0) {
      fs.unlinkSync(uploadedFilePath); // Clean up
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: req.user,
        error: 'CSV file is empty. Please upload a file with customer data.'
      });
    }

    if (rows.length > 500) {
      fs.unlinkSync(uploadedFilePath); // Clean up
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: req.user,
        error: `Too many rows (${rows.length}). Maximum 500 rows allowed per upload.`
      });
    }

    // Create upload record
    uploadRecord = await CsvUpload.create({
      userId: req.user.id,
      filename: filename,
      totalRows: rows.length,
      status: 'processing'
    });

    // Validate and categorize rows
    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      // Validate row
      const validation = validateRow(row);
      if (!validation.isValid) {
        invalidRows.push(row);
        errors.push({
          row: rowNumber,
          name: row.name,
          phone: row.phone,
          error: validation.errors.join(', ')
        });
        continue;
      }

      // Check for duplicates
      const isDuplicate = await isDuplicatePhone(req.user.id, row.phone);
      if (isDuplicate) {
        duplicateRows.push(row);
        errors.push({
          row: rowNumber,
          name: row.name,
          phone: row.phone,
          error: 'Duplicate: Already sent SMS to this number in last 30 days'
        });
        continue;
      }

      validRows.push({ ...row, rowNumber });
    }

    // Bulk create FeedbackRequests
    const feedbackRequests = validRows.map(row => ({
      userId: req.user.id,
      uuid: uuidv4(),
      customerName: row.name,
      phone: row.phone,
      email: row.email || null,
      status: 'pending',
      source: 'csv_upload'
    }));

    const createdRequests = await FeedbackRequest.bulkCreate(feedbackRequests);

    // Send SMS with rate limiting (1 per second)
    const limit = pLimit(1); // Concurrency: 1
    const smsDelay = 1000; // 1 second between each SMS

    const smsResults = await Promise.all(
      createdRequests.map((request, index) =>
        limit(async () => {
          try {
            // Wait before sending (rate limiting)
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, smsDelay));
            }

            const result = await sendSMS(
              request.phone,
              request.customerName,
              request.uuid
            );

            // Update status
            await request.update({
              status: 'sent',
              sentAt: new Date(),
              twilioMessageSid: result.messageSid
            });

            return { success: true, requestId: request.id };
          } catch (error) {
            console.error(`SMS failed for ${request.phone}:`, error);
            errors.push({
              row: validRows[index].rowNumber,
              name: request.customerName,
              phone: request.phone,
              error: `SMS failed: ${error.message}`
            });
            return { success: false, requestId: request.id, error: error.message };
          }
        })
      )
    );

    // Calculate results
    const successCount = smsResults.filter(r => r.success).length;
    const smsFailedCount = smsResults.filter(r => !r.success).length;
    const totalFailedCount = invalidRows.length + smsFailedCount;

    // Update upload record
    const processingTime = Date.now() - startTime;
    await uploadRecord.update({
      validRows: validRows.length,
      successCount: successCount,
      failedCount: totalFailedCount,
      duplicateCount: duplicateRows.length,
      errors: errors,
      status: successCount > 0 ? 'completed' : 'failed',
      processingTimeMs: processingTime,
      completedAt: new Date()
    });

    // Clean up uploaded file
    fs.unlinkSync(uploadedFilePath);

    // Render results
    res.render('upload-results', {
      title: 'Upload Results',
      user: req.user,
      results: {
        filename: filename,
        totalRows: rows.length,
        successCount: successCount,
        failedCount: totalFailedCount,
        duplicateCount: duplicateRows.length,
        errors: errors,
        processingTimeSeconds: Math.round(processingTime / 1000)
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);

    // Clean up file
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    // Update upload record if exists
    if (uploadRecord) {
      await uploadRecord.update({
        status: 'failed',
        errors: [{ error: error.message }],
        completedAt: new Date()
      });
    }

    res.status(500).render('upload', {
      title: 'Upload Customers',
      user: req.user,
      error: `Upload failed: ${error.message}`
    });
  }
};

// GET /dashboard/uploads - View upload history
const showUploadHistory = async (req, res) => {
  try {
    const uploads = await CsvUpload.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.render('upload-history', {
      title: 'Upload History',
      user: req.user,
      uploads: uploads
    });
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load upload history',
      error: { status: 500 }
    });
  }
};

module.exports = {
  upload,
  showUploadPage,
  processUpload,
  showUploadHistory
};
```

### 2. CSV Validator (`src/utils/csvValidator.js`)

```javascript
const { FeedbackRequest } = require('../models');
const { Op } = require('sequelize');

/**
 * Validate a CSV row
 */
const validateRow = (row) => {
  const errors = [];

  // Validate name (required, 2-100 chars)
  if (!row.name || row.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (row.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (row.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  // Validate phone (required, E.164 format)
  if (!row.phone || row.phone.trim().length === 0) {
    errors.push('Phone number is required');
  } else if (!row.phone.startsWith('+')) {
    errors.push('Phone must start with + (E.164 format, e.g., +1234567890)');
  } else if (row.phone.length < 10 || row.phone.length > 15) {
    errors.push('Phone number length invalid (must be 10-15 digits including +)');
  } else if (!/^\+[0-9]+$/.test(row.phone)) {
    errors.push('Phone must contain only + and digits');
  }

  // Validate email (optional, basic format check)
  if (row.email && row.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push('Invalid email format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Check if phone number is a duplicate for this user
 * Duplicate = same phone sent to within last 30 days
 */
const isDuplicatePhone = async (userId, phone) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const existingRequest = await FeedbackRequest.findOne({
    where: {
      userId: userId,
      phone: phone,
      createdAt: {
        [Op.gte]: thirtyDaysAgo
      }
    }
  });

  return existingRequest !== null;
};

module.exports = {
  validateRow,
  isDuplicatePhone
};
```

### 3. Upload Routes (`src/routes/uploadRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

// All routes require authentication
router.use(requireAuth);

// GET /dashboard/upload - Show upload form
router.get('/upload', uploadController.showUploadPage);

// POST /dashboard/upload - Process CSV
router.post(
  '/upload',
  uploadController.upload.single('csvFile'),
  uploadController.processUpload
);

// GET /dashboard/uploads - View upload history
router.get('/uploads', uploadController.showUploadHistory);

module.exports = router;
```

### 4. Register Routes in `app.js`

```javascript
// app.js (add this after other route registrations)

const uploadRoutes = require('./src/routes/uploadRoutes');
app.use('/dashboard', uploadRoutes);
```

---

## 🛡 Edge Cases & Validation

### File Validation

| Edge Case | Validation | Error Message |
|-----------|------------|---------------|
| No file uploaded | Check `req.file` exists | "No file uploaded. Please select a CSV file." |
| Wrong file type | Check extension is `.csv` | "Only CSV files are allowed" |
| File too large | Multer limit: 5MB | "File too large. Maximum 5MB allowed." |
| Empty file | Check `rows.length > 0` | "CSV file is empty." |
| Too many rows | Check `rows.length <= 500` | "Too many rows (X). Maximum 500 rows allowed." |

### CSV Format Validation

| Edge Case | Handling | Example |
|-----------|----------|---------|
| Missing headers | Accept common variations: `name`, `customer_name`, `phone`, `customer_phone` | ✅ Flexible |
| Different delimiters | `csv-parser` handles comma, semicolon, tab automatically | ✅ Auto-detect |
| Extra columns | Ignore columns we don't need | ✅ Graceful |
| Missing columns | Required: `name`, `phone`. Optional: `email` | ❌ Error if missing required |
| Whitespace | Trim all fields | ✅ `" John "` → `"John"` |
| Case sensitivity | Convert headers to lowercase | ✅ `Name` = `name` = `NAME` |

### Row Validation

| Field | Rules | Error Message |
|-------|-------|---------------|
| **Name** | Required, 2-100 chars | "Name is required" / "Name too short/long" |
| **Phone** | Required, E.164 format (starts with +), 10-15 chars, digits only | "Phone must start with + (E.164 format)" |
| **Email** | Optional, basic regex | "Invalid email format" |

### Duplicate Detection Logic

```sql
-- Query: Find existing FeedbackRequest with same phone in last 30 days
SELECT id FROM "FeedbackRequests"
WHERE "userId" = ?
  AND "phone" = ?
  AND "createdAt" >= (NOW() - INTERVAL '30 days')
LIMIT 1;
```

**Why 30 days?**
- Prevents spamming same customer
- Allows re-sending after 1 month if needed
- Balances business needs vs. customer annoyance

**Alternative approaches:**
1. **Ever duplicate:** Check if phone exists for this user (ever)
   - Pros: Ensures customer only contacted once
   - Cons: Can't re-engage past customers
2. **90 days:** Longer window
   - Pros: More conservative
   - Cons: Can't re-engage for 3 months
3. **No duplicate check:** Allow duplicates
   - Pros: Maximum flexibility
   - Cons: Could spam customers

**Recommendation:** 30 days (implemented above)

### SMS Rate Limiting

| Account Type | Rate Limit | Implementation |
|--------------|------------|----------------|
| Twilio Free/Trial | 1 msg/sec | `p-limit(1)` + `setTimeout(1000)` |
| Twilio Basic | 1 msg/sec | Same |
| Twilio Messaging Service | 10-100 msg/sec | `p-limit(10)` + `setTimeout(100)` |

**Current Implementation:** 1 msg/sec (safe for all account types)

**Future Enhancement:** Detect account type and adjust rate automatically

### Timeout Handling

| Scenario | Timeout | Handling |
|----------|---------|----------|
| HTTP request | 10 minutes | Express timeout middleware |
| Parsing CSV | 30 seconds | Should be instant for 500 rows |
| Database insert | 10 seconds | Sequelize timeout |
| Single SMS | 10 seconds | Twilio timeout |
| All SMS (500 rows) | ~8-9 minutes | Within 10-minute window |

**Formula:** `500 rows × 1 second/SMS = 500 seconds = 8.3 minutes` ✅ Safe

---

## 🧪 Testing Strategy

### Unit Tests

```javascript
// tests/csvValidator.test.js
const { validateRow, isDuplicatePhone } = require('../src/utils/csvValidator');

describe('CSV Validator', () => {
  describe('validateRow', () => {
    test('valid row passes', () => {
      const row = { name: 'John Doe', phone: '+1234567890', email: 'john@example.com' };
      const result = validateRow(row);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('missing name fails', () => {
      const row = { name: '', phone: '+1234567890', email: '' };
      const result = validateRow(row);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    test('invalid phone format fails', () => {
      const row = { name: 'John', phone: '1234567890', email: '' }; // Missing +
      const result = validateRow(row);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must start with +');
    });

    test('invalid email fails', () => {
      const row = { name: 'John', phone: '+1234567890', email: 'notanemail' };
      const result = validateRow(row);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });
});
```

### Integration Tests

```javascript
// tests/uploadController.test.js
const request = require('supertest');
const app = require('../app');
const fs = require('fs');
const path = require('path');

describe('CSV Upload Controller', () => {
  let authCookie; // Login cookie

  beforeAll(async () => {
    // Login to get session cookie
    const loginRes = await request(app)
      .post('/login')
      .send({ email: 'test@business.com', password: 'password123' });
    authCookie = loginRes.headers['set-cookie'];
  });

  test('GET /dashboard/upload shows form', async () => {
    const res = await request(app)
      .get('/dashboard/upload')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Upload Customers');
  });

  test('POST /dashboard/upload with valid CSV succeeds', async () => {
    const csvPath = path.join(__dirname, 'fixtures', 'valid-customers.csv');

    const res = await request(app)
      .post('/dashboard/upload')
      .set('Cookie', authCookie)
      .attach('csvFile', csvPath);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Upload Results');
    expect(res.text).toContain('Success');
  });

  test('POST /dashboard/upload with invalid CSV fails', async () => {
    const csvPath = path.join(__dirname, 'fixtures', 'invalid-customers.csv');

    const res = await request(app)
      .post('/dashboard/upload')
      .set('Cookie', authCookie)
      .attach('csvFile', csvPath);

    expect(res.status).toBe(200); // Renders results page
    expect(res.text).toContain('Failed');
  });

  test('POST /dashboard/upload with >500 rows fails', async () => {
    // Generate CSV with 501 rows
    const csvContent = generateLargeCSV(501);
    const csvPath = '/tmp/large-test.csv';
    fs.writeFileSync(csvPath, csvContent);

    const res = await request(app)
      .post('/dashboard/upload')
      .set('Cookie', authCookie)
      .attach('csvFile', csvPath);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Too many rows');

    fs.unlinkSync(csvPath);
  });
});
```

### Manual Test Cases

#### Test Case 1: Valid CSV (Happy Path)
**File:** `test-valid.csv`
```csv
name,phone,email
John Doe,+1234567890,john@example.com
Jane Smith,+1987654321,jane@example.com
Bob Johnson,+1555555555,
```

**Expected:**
- ✅ 3 rows processed
- ✅ 3 SMS sent
- ✅ 0 failed
- ✅ 0 duplicates

#### Test Case 2: Invalid Phone Numbers
**File:** `test-invalid-phones.csv`
```csv
name,phone,email
John Doe,1234567890,john@example.com
Jane Smith,+1ABC7654321,jane@example.com
Bob Johnson,+1555,bob@example.com
```

**Expected:**
- ✅ 3 rows processed
- ✅ 0 SMS sent
- ❌ 3 failed (all invalid phone formats)

#### Test Case 3: Duplicates
**File:** `test-duplicates.csv`
```csv
name,phone,email
John Doe,+1234567890,john@example.com
Jane Smith,+1234567890,jane@example.com
```

**Expected (assuming +1234567890 was contacted in last 30 days):**
- ✅ 2 rows processed
- ❌ 2 duplicates (same phone number)
- ✅ 0 SMS sent

#### Test Case 4: Mixed Results
**File:** `test-mixed.csv`
```csv
name,phone,email
Valid Customer,+1234567890,valid@example.com
Invalid Phone,1234567890,invalid@example.com
,+1555555555,missing-name@example.com
Duplicate,+1111111111,duplicate@example.com
Another Valid,+1999999999,another@example.com
```

**Expected:**
- ✅ 5 rows processed
- ✅ 2 SMS sent (Valid Customer, Another Valid)
- ❌ 2 failed (Invalid Phone, Missing Name)
- ❌ 1 duplicate (Duplicate)

#### Test Case 5: Large File (500 rows)
**File:** `test-large.csv` (generated programmatically)

**Expected:**
- ✅ 500 rows processed
- ✅ 500 SMS sent (or as many as valid)
- ⏱️ Processing time: ~8-9 minutes
- ✅ No timeout

#### Test Case 6: Too Large (501 rows)
**Expected:**
- ❌ Error: "Too many rows (501). Maximum 500 rows allowed."

---

## 🚀 Deployment Plan

### Step 1: Database Migration

```bash
# On production VPS
cd /root/FilterFive

# Add new model to src/models/CsvUpload.js
# Update src/models/index.js with relationships

# Run migration
docker exec filterfive_app_prod node src/scripts/migrateCsvUploads.js

# Verify table created
docker exec -it filterfive_db_prod psql -U filterfive_prod_user -d filterfive_prod -c "\d CsvUploads"
```

### Step 2: Code Deployment

```bash
# Push to GitHub
git add .
git commit -m "Add CSV upload feature (v1.2.0)"
git push origin main

# Deploy to production
ssh root@31.97.215.238
cd /root/FilterFive
git pull origin main
./deploy.sh
```

### Step 3: Testing in Production

```bash
# 1. Login to production
open https://filterfive.io/dashboard/login

# 2. Navigate to upload page
# Should see: https://filterfive.io/dashboard/upload

# 3. Upload test CSV (5 rows)
# Verify: SMS sent, results displayed correctly

# 4. Check upload history
# Should see: https://filterfive.io/dashboard/uploads

# 5. Verify database records
docker exec -it filterfive_db_prod psql -U filterfive_prod_user -d filterfive_prod -c "SELECT * FROM \"CsvUploads\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

### Step 4: Monitoring

```bash
# Watch logs during first uploads
docker logs -f --tail=100 filterfive_app_prod

# Check for errors
docker logs filterfive_app_prod | grep -i error

# Monitor Twilio dashboard
# https://console.twilio.com/us1/monitor/logs/sms

# Monitor Resend dashboard (if email alerts sent)
# https://resend.com/emails
```

---

## 📝 Documentation Updates

After implementation, update these files:

### README.md
Add to Features section:
```markdown
- **📤 CSV Upload** - Bulk import up to 500 customers at once via CSV
```

### AI_CONTEXT.md
Add new data flow:
```markdown
## Data Flow 5: CSV Upload Flow
1. Tenant uploads CSV file (name, phone, email)
2. System parses and validates all rows
3. Duplicates detected (same phone in last 30 days)
4. Valid rows bulk-inserted as FeedbackRequests
5. SMS sent to all valid customers (rate-limited)
6. Results displayed with success/failed/duplicate counts
7. Upload history saved in CsvUploads table
```

### OPS.md
Add troubleshooting section:
```markdown
## CSV Upload Issues

**Problem:** Upload times out
**Solution:**
- Check file has <500 rows
- Verify Twilio API is responding (check logs)
- Increase timeout in Nginx if needed

**Problem:** SMS not sending
**Solution:**
- Check Twilio credentials
- Verify phone numbers are E.164 format
- Check rate limiting (1/sec default)
```

---

## ✅ Success Criteria Checklist

Before marking this feature complete, verify:

- [ ] CSV files up to 5MB can be uploaded
- [ ] Maximum 500 rows enforced
- [ ] Name and phone validation works
- [ ] Email validation works (optional field)
- [ ] Duplicate detection (30 days) works
- [ ] Bulk insert creates FeedbackRequests correctly
- [ ] SMS sent with rate limiting (1/sec)
- [ ] Results page shows accurate counts
- [ ] Error details displayed clearly
- [ ] Upload history page shows past uploads
- [ ] CsvUpload records saved correctly
- [ ] Sample CSV template downloadable
- [ ] Works on mobile browsers
- [ ] No memory leaks (tested with 500 rows)
- [ ] No timeout issues (completes within 10 min)
- [ ] Unit tests pass (validator)
- [ ] Integration tests pass (controller)
- [ ] Documentation updated
- [ ] Deployed to production successfully
- [ ] Tested with real Twilio account
- [ ] Monitoring in place

---

## 🎯 Future Enhancements (v1.2.1+)

### Priority 1: Asynchronous Processing
- Add job queue (Bull + Redis or pg-boss)
- Process large files in background
- Email notification when complete
- Real-time progress updates (WebSocket)

### Priority 2: Advanced Features
- CSV column mapping UI (drag & drop)
- Schedule uploads for future date/time
- Recurring uploads (weekly/monthly)
- Import from Google Sheets directly
- Import from Stripe customers API

### Priority 3: Error Recovery
- Pause/resume large uploads
- Retry failed SMS automatically
- Download failed rows as CSV
- Re-upload only failed rows

### Priority 4: Analytics
- Upload frequency metrics
- Average success rate per tenant
- Most common validation errors
- SMS delivery rate trends

---

**Feature Plan Document Version:** 1.0
**Created:** January 28, 2025
**Author:** FilterFive Development Team
**Status:** 📋 Ready for Implementation
