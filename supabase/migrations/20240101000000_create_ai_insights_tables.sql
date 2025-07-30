-- Enhanced AI Email Insights Database Schema
-- Migration: 20240101000000_create_ai_insights_tables

-- Create insight_analysis table
-- Stores the main analysis results
CREATE TABLE insight_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_hash TEXT NOT NULL,
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    date_range TEXT NOT NULL,
    raw_insights JSONB NOT NULL,
    ai_enhanced_insights JSONB,
    custom_discoveries JSONB,
    processing_status TEXT DEFAULT 'pending',
    processing_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create insight_cache table
-- Caches expensive calculations
CREATE TABLE insight_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    cached_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create processing_jobs table
-- Tracks background processing jobs
CREATE TABLE processing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id TEXT,
    job_type TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    status_message TEXT,
    result JSONB,
    error JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_analysis_account_date ON insight_analysis(account_hash, analysis_date DESC);
CREATE INDEX idx_cache_key ON insight_cache(cache_key);
CREATE INDEX idx_jobs_status ON processing_jobs(account_id, status);

-- Enable Row Level Security (RLS) - policies disabled for now
ALTER TABLE insight_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE insight_analysis IS 'Stores main AI analysis results for email insights';
COMMENT ON TABLE insight_cache IS 'Caches expensive calculations to improve performance';
COMMENT ON TABLE processing_jobs IS 'Tracks background processing jobs for AI insights';

COMMENT ON COLUMN insight_analysis.account_hash IS 'Hashed identifier for user account';
COMMENT ON COLUMN insight_analysis.date_range IS 'Date range for the analysis (e.g., 30d, 90d)';
COMMENT ON COLUMN insight_analysis.raw_insights IS 'Raw analysis data from initial processing';
COMMENT ON COLUMN insight_analysis.ai_enhanced_insights IS 'AI-enhanced insights with recommendations';
COMMENT ON COLUMN insight_analysis.custom_discoveries IS 'Custom pattern discoveries and insights';
COMMENT ON COLUMN insight_analysis.processing_status IS 'Status: pending, processing, completed, failed';

COMMENT ON COLUMN insight_cache.cache_key IS 'Unique key for cached data lookup';
COMMENT ON COLUMN insight_cache.expires_at IS 'Cache expiration timestamp';

COMMENT ON COLUMN processing_jobs.job_type IS 'Type of processing job (e.g., ai_analysis, pattern_discovery)';
COMMENT ON COLUMN processing_jobs.status IS 'Job status: queued, running, completed, failed';
COMMENT ON COLUMN processing_jobs.progress IS 'Job progress percentage (0-100)';
