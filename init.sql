-- Initial setup for Quran Khatm Bot Database
-- This file runs automatically when PostgreSQL container starts

-- Create database if not exists (already created by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS quran_khatm_bot;

-- Set timezone
SET timezone = 'UTC';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE quran_khatm_bot TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Quran Khatm Bot database initialized successfully';
END $$;