-- Fix RLS policies for user_screening_sessions table
-- This script safely adds policies without conflicts

-- Enable RLS if not already enabled
ALTER TABLE user_screening_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can access their own screening sessions" ON user_screening_sessions;
DROP POLICY IF EXISTS "Users can create their own screening sessions" ON user_screening_sessions;
DROP POLICY IF EXISTS "Service role can access all screening sessions" ON user_screening_sessions;
DROP POLICY IF EXISTS "Users can access their own screening results" ON screening_results;
DROP POLICY IF EXISTS "Service role can access all screening results" ON screening_results;

-- Add policy for users to access their own screening sessions
CREATE POLICY "Users can access their own screening sessions" ON user_screening_sessions
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Add policy for users to create their own screening sessions  
CREATE POLICY "Users can create their own screening sessions" ON user_screening_sessions
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Add policy for service role to access all sessions (for n8n workflows)
CREATE POLICY "Service role can access all screening sessions" ON user_screening_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Also add policy for screening_results table to work with sessions
CREATE POLICY "Users can access their own screening results" ON screening_results
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM user_screening_sessions 
      WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Service role can access all screening results
CREATE POLICY "Service role can access all screening results" ON screening_results
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('user_screening_sessions', 'screening_results')
ORDER BY tablename, policyname;
