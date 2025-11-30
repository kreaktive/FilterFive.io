# Feedback Management API - Backend Testing Guide

## Database Setup ✅
- [x] Migration completed successfully
- [x] All columns added: `feedback_status`, `viewed_at`, `responded_at`, `resolved_at`, `internal_notes`
- [x] Indexes created: `reviews_user_status_idx`, `reviews_user_rating_idx`
- [x] Test data available: 5 reviews with feedback text

## Endpoints to Test

### 1. GET /dashboard/feedback - List Feedback (Main View)
**Description**: Paginated list of feedback with comprehensive filtering

**Query Parameters**:
- `page` (int, default: 1) - Page number
- `limit` (int, default: 25) - Items per page
- `rating` (string) - Filter by rating: '1', '2', '3', '4', '5', or 'all'
- `status` (string) - Filter by status: 'new', 'viewed', 'responded', 'resolved', or 'all'
- `hasFeedback` (string) - Filter: 'true', 'false', or 'all'
- `dateRange` (int, default: 30) - Filter by days
- `search` (string) - Keyword search in feedback text

**Test Commands**:
```bash
# Basic list (requires login)
curl -b cookies.txt http://localhost:3000/dashboard/feedback

# With filters
curl -b cookies.txt "http://localhost:3000/dashboard/feedback?rating=1&status=new&dateRange=7"

# With search
curl -b cookies.txt "http://localhost:3000/dashboard/feedback?search=terrible"

# Pagination
curl -b cookies.txt "http://localhost:3000/dashboard/feedback?page=2&limit=10"
```

**Expected Response**: Renders `dashboard/feedback.ejs` with:
- `feedbackList`: Array of FeedbackRequest objects with nested Review
- `pagination`: Object with currentPage, totalPages, hasNext, hasPrev, etc.
- `filters`: Current filter values

---

### 2. POST /dashboard/feedback/:id/view - Mark as Viewed
**Description**: Auto-track when tenant views feedback

**Body**: None (automatic)

**Test Command**:
```bash
curl -X POST \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  http://localhost:3000/dashboard/feedback/2/view
```

**Expected Response**:
```json
{
  "success": true,
  "status": "viewed"
}
```

**Database Changes**:
- `feedback_status` → 'viewed'
- `viewed_at` → current timestamp

---

### 3. POST /dashboard/feedback/:id/respond - Send SMS Response
**Description**: Send custom SMS reply to customer

**Body**:
```json
{
  "message": "Thank you for your feedback! We'd love to make this right. Please call us at (555) 123-4567."
}
```

**Test Command**:
```bash
curl -X POST \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"message":"Thank you for your feedback!"}' \
  http://localhost:3000/dashboard/feedback/2/respond
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Response sent successfully",
  "twilioSid": "SM..."
}
```

**Database Changes**:
- `feedback_status` → 'responded'
- `responded_at` → current timestamp
- Twilio SMS sent to customer's phone

---

### 4. POST /dashboard/feedback/:id/note - Add Internal Note
**Description**: Add private notes about the feedback

**Body**:
```json
{
  "note": "Customer called back - issue resolved. Offered 20% discount on next visit."
}
```

**Test Command**:
```bash
curl -X POST \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"note":"Customer called back - resolved"}' \
  http://localhost:3000/dashboard/feedback/2/note
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Note added successfully",
  "internalNotes": "[2025-01-29T...] Customer called back - resolved"
}
```

**Database Changes**:
- `internal_notes` → Appends note with timestamp

---

### 5. POST /dashboard/feedback/:id/status - Update Status
**Description**: Manually change feedback status

**Body**:
```json
{
  "status": "resolved"
}
```

**Valid statuses**: 'new', 'viewed', 'responded', 'resolved'

**Test Command**:
```bash
curl -X POST \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}' \
  http://localhost:3000/dashboard/feedback/2/status
```

**Expected Response**:
```json
{
  "success": true,
  "status": "resolved",
  "message": "Status updated to resolved"
}
```

**Database Changes**:
- `feedback_status` → specified status
- `resolved_at` → current timestamp (if status='resolved')
- `viewed_at` → current timestamp (if not already set)

---

### 6. POST /dashboard/feedback/bulk-update - Bulk Status Update
**Description**: Update multiple feedback items at once

**Body**:
```json
{
  "reviewIds": [2, 3, 4],
  "status": "viewed"
}
```

**Test Command**:
```bash
curl -X POST \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"reviewIds":[2,3,4],"status":"viewed"}' \
  http://localhost:3000/dashboard/feedback/bulk-update
```

**Expected Response**:
```json
{
  "success": true,
  "updatedCount": 3,
  "message": "3 feedback items updated to viewed"
}
```

**Database Changes**:
- All specified reviews updated to new status
- Appropriate timestamps set

---

### 7. GET /dashboard/feedback/export - Export to CSV
**Description**: Download filtered feedback as CSV

**Query Parameters**: Same as list endpoint (rating, status, dateRange, search)

**Test Command**:
```bash
curl -b cookies.txt \
  "http://localhost:3000/dashboard/feedback/export?rating=1&status=all" \
  -o feedback-export.csv
```

**Expected Response**: CSV file download
```csv
Customer Name,Phone,Rating,Feedback,Status,Date,Internal Notes
"Anonymous","+15551234567",1,"Service was terrible","new","2025-01-29T...",""
...
```

---

### 8. GET /dashboard/feedback/word-cloud - Generate Word Cloud Data
**Description**: Text analysis for feedback visualization

**Query Parameters**:
- `dateRange` (int, default: 30) - Days to analyze

**Test Command**:
```bash
curl -b cookies.txt \
  "http://localhost:3000/dashboard/feedback/word-cloud?dateRange=30"
```

**Expected Response**:
```json
{
  "success": true,
  "words": [
    {"text": "service", "value": 12},
    {"text": "terrible", "value": 8},
    {"text": "wait", "value": 6},
    {"text": "staff", "value": 5}
  ],
  "totalReviews": 15
}
```

**Features**:
- Filters out stop words (the, a, and, etc.)
- Only includes words longer than 3 characters
- Returns top 50 most frequent words

---

## How to Test with Authentication

### 1. Login via Browser
1. Open browser to http://localhost:3000/dashboard/login
2. Login with a test account (e.g., test@business.com)
3. Open browser dev tools (F12)
4. Go to Application > Cookies
5. Copy the `connect.sid` cookie value

### 2. Create Cookie File for curl
```bash
echo "localhost:3000\tFALSE\t/\tFALSE\t0\tconnect.sid\tYOUR_SESSION_ID_HERE" > cookies.txt
```

### 3. Use Cookie in Tests
All test commands above use `-b cookies.txt` to include the session cookie.

---

## Test Data in Database

Current reviews available for testing:

| ID | User ID | Rating | Feedback Preview | Status |
|----|---------|--------|-----------------|--------|
| 2 | 1 | 1 | "test feedback from 1 star" | new |
| 3 | 1 | 2 | "The service was terrible..." | new |
| 4 | 1 | 2 | "huele a culo feedback test" | new |
| 7 | 3 | 2 | "as" | new |
| 8 | 1 | 3 | "3 stars" | new |

---

## Quick Verification Tests

### Test 1: Check if routes are registered
```bash
docker-compose exec app node -e "
const app = require('./app');
console.log('Registered routes:');
app._router.stack.forEach(r => {
  if (r.route) console.log(r.route.path);
});
"
```

### Test 2: Verify database columns
```bash
docker-compose exec -T db psql -U postgres -d filterfive -c "
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('feedback_status', 'viewed_at', 'responded_at', 'resolved_at', 'internal_notes')
ORDER BY ordinal_position;
"
```

### Test 3: Check controller is loaded
```bash
docker-compose exec app node -e "
const controller = require('./src/controllers/feedbackController');
console.log('Controller functions:', Object.keys(controller));
"
```

---

## Implementation Status

1. ✅ Backend implementation complete
2. ✅ Frontend implementation complete
3. ✅ Navigation links added to all dashboard pages
4. ⏳ Ready for user testing

### Frontend Features Implemented:
   - ✅ `dashboard/feedback.ejs` view with full styling
   - ✅ Comprehensive filter controls (rating, status, date range, search)
   - ✅ Client-side table sorting on all columns
   - ✅ Row color-coding (red 1-2★, orange 3★, green 4-5★)
   - ✅ Expandable feedback text with auto-view tracking
   - ✅ Pagination controls (10/25/50/100 per page)
   - ✅ Respond Modal with SMS templates & character counter
   - ✅ Notes Modal with history display
   - ✅ Bulk selection with bulk action toolbar
   - ✅ Word cloud visualization (collapsible)
   - ✅ Alert system for success/error messages
   - ✅ Mobile-responsive design
   - ✅ Actions dropdown menu per row
   - ✅ Export to CSV functionality

---

## Error Handling

All endpoints include proper error handling:
- 400: Bad request (missing required fields, invalid status)
- 404: Review not found or doesn't belong to user
- 500: Server error (database, Twilio failures)

Test error cases:
```bash
# Invalid status
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"status":"invalid"}' \
  http://localhost:3000/dashboard/feedback/2/status

# Non-existent review
curl -X POST -b cookies.txt \
  http://localhost:3000/dashboard/feedback/99999/view

# Empty message
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"message":""}' \
  http://localhost:3000/dashboard/feedback/2/respond
```
