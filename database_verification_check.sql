-- =====================================================
-- COIN ODYSSEY DATABASE VERIFICATION SCRIPT
-- =====================================================
-- This script verifies that all required tables, columns, 
-- indexes, and policies are properly set up in Supabase
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. CHECK CORE TABLES EXISTENCE
-- Expected: collections, coins, collection_shares, contact_messages, user_consent_preferences, user_consent_history
SELECT 
  'CORE TABLES CHECK' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
ORDER BY table_name;

-- 2. CHECK COLLECTIONS TABLE STRUCTURE
SELECT 
  'COLLECTIONS TABLE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'collections'
ORDER BY ordinal_position;

-- 3. CHECK COINS TABLE STRUCTURE
SELECT 
  'COINS TABLE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'coins'
ORDER BY ordinal_position;

-- 4. CHECK CONTACT MESSAGES TABLE
SELECT 
  'CONTACT MESSAGES TABLE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'contact_messages'
ORDER BY ordinal_position;

-- 5. CHECK USER CONSENT PREFERENCES TABLE
SELECT 
  'USER CONSENT PREFERENCES' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_consent_preferences'
ORDER BY ordinal_position;

-- 6. CHECK USER CONSENT HISTORY TABLE
SELECT 
  'USER CONSENT HISTORY' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_consent_history'
ORDER BY ordinal_position;

-- 7. CHECK RLS (ROW LEVEL SECURITY) STATUS
SELECT 
  'RLS STATUS CHECK' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED' 
    ELSE '❌ DISABLED' 
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
ORDER BY tablename;

-- 8. CHECK RLS POLICIES
SELECT 
  'RLS POLICIES CHECK' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd as command_type,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
ORDER BY tablename, policyname;

-- 9. CHECK INDEXES
SELECT 
  'INDEXES CHECK' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
  AND indexname NOT LIKE '%_pkey'  -- Exclude primary key indexes
ORDER BY tablename, indexname;

-- 10. CHECK FOREIGN KEY CONSTRAINTS
SELECT 
  'FOREIGN KEYS CHECK' as check_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
ORDER BY tc.table_name, tc.constraint_name;

-- 11. CHECK TRIGGERS
SELECT 
  'TRIGGERS CHECK' as check_type,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
ORDER BY event_object_table, trigger_name;

-- 12. CHECK CUSTOM FUNCTIONS
SELECT 
  'CUSTOM FUNCTIONS CHECK' as check_type,
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'update_consent_updated_at_column',
    'create_consent_history_entry',
    'create_default_consent_preferences',
    'update_updated_at_column'
  )
ORDER BY routine_name;

-- 13. VERIFY CRITICAL COLUMNS IN COINS TABLE
WITH expected_coin_columns AS (
  SELECT unnest(ARRAY[
    'id', 'collection_id', 'denomination', 'year', 'mint_mark', 
    'grade', 'purchase_price', 'purchase_date', 'notes', 'images', 
    'country', 'created_at', 'updated_at'
  ]) as expected_column
),
actual_coin_columns AS (
  SELECT column_name
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'coins'
)
SELECT 
  'COINS COLUMNS CHECK' as check_type,
  'coins' as table_name,
  expected_column,
  CASE 
    WHEN expected_column IN (SELECT column_name FROM actual_coin_columns) 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM expected_coin_columns
ORDER BY expected_column;

-- 14. VERIFY GPC COLUMNS IN USER CONSENT TABLE
WITH expected_consent_columns AS (
  SELECT unnest(ARRAY[
    'gpc_enabled', 'gpc_processed_at', 'gpc_detected_at',
    'data_processing', 'third_party_services', 'international_transfers'
  ]) as expected_column
),
actual_consent_columns AS (
  SELECT column_name
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'user_consent_preferences'
)
SELECT 
  'CONSENT COLUMNS CHECK' as check_type,
  'user_consent_preferences' as table_name,
  expected_column,
  CASE 
    WHEN expected_column IN (SELECT column_name FROM actual_consent_columns) 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM expected_consent_columns
ORDER BY expected_column;

-- 15. SUMMARY REPORT
WITH table_counts AS (
  SELECT 
    'Expected Tables' as metric,
    6 as expected_count,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
       AND table_name IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
    ) as actual_count
  UNION ALL
  SELECT 
    'RLS Enabled Tables' as metric,
    6 as expected_count,
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' 
       AND tablename IN ('collections', 'coins', 'collection_shares', 'contact_messages', 'user_consent_preferences', 'user_consent_history')
       AND rowsecurity = true
    ) as actual_count
  UNION ALL
  SELECT 
    'Custom Functions' as metric,
    4 as expected_count,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' 
       AND routine_name IN ('update_consent_updated_at_column', 'create_consent_history_entry', 'create_default_consent_preferences', 'update_updated_at_column')
    ) as actual_count
)
SELECT 
  'SUMMARY REPORT' as check_type,
  metric,
  expected_count,
  actual_count,
  CASE 
    WHEN expected_count = actual_count THEN '✅ COMPLETE'
    WHEN actual_count > 0 THEN '⚠️ PARTIAL'
    ELSE '❌ MISSING'
  END as status
FROM table_counts;

-- VERIFICATION COMPLETE!
-- 
-- NEXT STEPS:
-- - If any tables show ❌ MISSING, run the corresponding schema files
-- - If RLS is ❌ DISABLED, check your RLS policies  
-- - If functions are ❌ MISSING, run the user_consent_schema.sql
-- - All ✅ items indicate proper setup 