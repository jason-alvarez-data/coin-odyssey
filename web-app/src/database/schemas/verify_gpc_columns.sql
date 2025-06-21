-- Verification Script: Check All GPC Columns
-- Run this to verify all GPC fields were added correctly

-- Check user_consent_preferences table (should have 3 GPC columns)
SELECT 
  'user_consent_preferences' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'user_consent_preferences' 
AND column_name IN ('gpc_enabled', 'gpc_processed_at', 'gpc_detected_at')

UNION ALL

-- Check user_consent_history table (should have 2 GPC columns)
SELECT 
  'user_consent_history' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'user_consent_history' 
AND column_name IN ('gpc_enabled', 'gpc_processed_at')
ORDER BY table_name, column_name;

-- Also show a sample of the table structure
SELECT 
  table_name,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name IN ('user_consent_preferences', 'user_consent_history')
GROUP BY table_name; 