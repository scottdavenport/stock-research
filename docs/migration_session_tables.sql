-- Migration script to add session-based screening tables
-- Run this after the existing supabase_schema.sql

-- User screening sessions table (for async screening workflow)
CREATE TABLE IF NOT EXISTS user_screening_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  total_stocks_screened INTEGER DEFAULT 0,
  total_buy_rated INTEGER DEFAULT 0,
  buy_percentage NUMERIC(5,2) DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  processing_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  screening_filters JSONB -- Store the original screening parameters
);

-- Update screening_results table to work with sessions (only if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'screening_results' AND column_name = 'session_id') THEN
        ALTER TABLE screening_results ADD COLUMN session_id UUID REFERENCES user_screening_sessions(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'screening_results' AND column_name = 'rank_position') THEN
        ALTER TABLE screening_results ADD COLUMN rank_position INTEGER;
    END IF;
END $$;

-- Indexes for session-based screening
CREATE INDEX IF NOT EXISTS idx_user_screening_sessions_user_email ON user_screening_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_screening_sessions_status ON user_screening_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_screening_sessions_created_at ON user_screening_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screening_results_session_id ON screening_results(session_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_rank_position ON screening_results(rank_position);

-- Enable RLS on the new table
ALTER TABLE user_screening_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_screening_sessions
CREATE POLICY "Users can view their own screening sessions" ON user_screening_sessions 
  FOR SELECT USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own screening sessions" ON user_screening_sessions 
  FOR INSERT WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own screening sessions" ON user_screening_sessions 
  FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

-- For now, allow all operations (when auth is not set up)
CREATE POLICY "Allow all operations on screening sessions" ON user_screening_sessions 
  FOR ALL USING (TRUE);
