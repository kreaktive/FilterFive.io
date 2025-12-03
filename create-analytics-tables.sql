-- Create Analytics Tables for FilterFive
-- Run this directly in PostgreSQL to create analytics_snapshots and timing_performance tables

-- Create analytics_snapshots table
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  location VARCHAR(255),

  -- Request metrics
  requests_sent INTEGER NOT NULL DEFAULT 0,
  requests_sms INTEGER NOT NULL DEFAULT 0,
  requests_qr INTEGER NOT NULL DEFAULT 0,
  requests_clicked INTEGER NOT NULL DEFAULT 0,
  requests_rated INTEGER NOT NULL DEFAULT 0,

  -- Review metrics
  reviews_positive INTEGER NOT NULL DEFAULT 0,
  reviews_negative INTEGER NOT NULL DEFAULT 0,
  reviews_1_star INTEGER NOT NULL DEFAULT 0,
  reviews_2_star INTEGER NOT NULL DEFAULT 0,
  reviews_3_star INTEGER NOT NULL DEFAULT 0,
  reviews_4_star INTEGER NOT NULL DEFAULT 0,
  reviews_5_star INTEGER NOT NULL DEFAULT 0,

  -- Calculated metrics
  average_rating NUMERIC(3, 2),
  click_rate NUMERIC(5, 2),
  conversion_rate NUMERIC(5, 2),
  positive_rate NUMERIC(5, 2),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON COLUMN analytics_snapshots.user_id IS 'User (tenant) this snapshot belongs to';
COMMENT ON COLUMN analytics_snapshots.snapshot_date IS 'Date this snapshot represents (UTC)';
COMMENT ON COLUMN analytics_snapshots.location IS 'Business location (NULL for aggregated/all locations)';
COMMENT ON COLUMN analytics_snapshots.requests_sent IS 'Total feedback requests sent (SMS + QR visits)';
COMMENT ON COLUMN analytics_snapshots.requests_sms IS 'Requests sent via SMS';
COMMENT ON COLUMN analytics_snapshots.requests_qr IS 'Requests via QR code visits';
COMMENT ON COLUMN analytics_snapshots.requests_clicked IS 'Requests where customer clicked feedback link';
COMMENT ON COLUMN analytics_snapshots.requests_rated IS 'Requests where customer submitted rating';
COMMENT ON COLUMN analytics_snapshots.reviews_positive IS 'Reviews with rating >= 4 (sent to Google)';
COMMENT ON COLUMN analytics_snapshots.reviews_negative IS 'Reviews with rating < 4 (filtered, private)';
COMMENT ON COLUMN analytics_snapshots.reviews_1_star IS '1-star reviews (trigger manager alerts)';
COMMENT ON COLUMN analytics_snapshots.average_rating IS 'Average star rating for this day (1.00-5.00)';
COMMENT ON COLUMN analytics_snapshots.click_rate IS 'Percentage: (clicked / sent) * 100';
COMMENT ON COLUMN analytics_snapshots.conversion_rate IS 'Percentage: (rated / clicked) * 100';
COMMENT ON COLUMN analytics_snapshots.positive_rate IS 'Percentage: (positive / rated) * 100';

-- Add indexes for analytics_snapshots
CREATE UNIQUE INDEX IF NOT EXISTS analytics_snapshots_unique_idx
  ON analytics_snapshots(user_id, snapshot_date, location);

CREATE INDEX IF NOT EXISTS analytics_snapshots_date_idx
  ON analytics_snapshots(user_id, snapshot_date);

-- Create timing_performance table
CREATE TABLE IF NOT EXISTS timing_performance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  hour_of_day INTEGER NOT NULL,
  location VARCHAR(255),

  -- Aggregated metrics
  requests_sent INTEGER NOT NULL DEFAULT 0,
  requests_clicked INTEGER NOT NULL DEFAULT 0,
  requests_rated INTEGER NOT NULL DEFAULT 0,
  reviews_positive INTEGER NOT NULL DEFAULT 0,

  -- Calculated rates
  click_rate NUMERIC(5, 2),
  conversion_rate NUMERIC(5, 2),
  positive_rate NUMERIC(5, 2),
  performance_score NUMERIC(5, 2),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON COLUMN timing_performance.user_id IS 'User (tenant) this timing data belongs to';
COMMENT ON COLUMN timing_performance.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN timing_performance.hour_of_day IS 'Hour of day: 0-23 (24-hour format, user timezone)';
COMMENT ON COLUMN timing_performance.location IS 'Business location (NULL for aggregated/all locations)';
COMMENT ON COLUMN timing_performance.requests_sent IS 'Total requests sent in this time slot';
COMMENT ON COLUMN timing_performance.requests_clicked IS 'Requests clicked in this time slot';
COMMENT ON COLUMN timing_performance.requests_rated IS 'Requests rated in this time slot';
COMMENT ON COLUMN timing_performance.reviews_positive IS 'Positive reviews (4-5 stars) in this time slot';
COMMENT ON COLUMN timing_performance.click_rate IS 'Percentage: (clicked / sent) * 100';
COMMENT ON COLUMN timing_performance.conversion_rate IS 'Percentage: (rated / clicked) * 100';
COMMENT ON COLUMN timing_performance.positive_rate IS 'Percentage: (positive / rated) * 100';
COMMENT ON COLUMN timing_performance.performance_score IS 'Composite score: (click_rate * 0.3) + (conversion_rate * 0.3) + (positive_rate * 0.4)';

-- Add indexes for timing_performance
CREATE UNIQUE INDEX IF NOT EXISTS timing_performance_unique_idx
  ON timing_performance(user_id, day_of_week, hour_of_day, location);

CREATE INDEX IF NOT EXISTS timing_performance_user_idx
  ON timing_performance(user_id);

-- Success message
SELECT 'Analytics tables created successfully!' AS status;
