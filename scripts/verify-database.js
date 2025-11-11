// Database Verification Script
// This script checks if all required tables exist in Supabase

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'web-app', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Required tables for Phase 1
const requiredTables = [
  'coins',
  'collections',
  'collection_goals',
  'user_achievements'
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      // If error code is 42P01, table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { exists: false, error: error.message };
      }
      // Other errors might be permissions-related
      return { exists: true, error: error.message, warning: 'Table exists but may have permission issues' };
    }

    return { exists: true, rowCount: data?.length || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase Database Schema...\n');
  console.log(`📡 Connected to: ${supabaseUrl}\n`);

  const results = {};
  let allTablesExist = true;

  for (const table of requiredTables) {
    process.stdout.write(`Checking table: ${table}... `);
    const result = await checkTableExists(table);
    results[table] = result;

    if (result.exists) {
      console.log(`✅ EXISTS`);
      if (result.warning) {
        console.log(`   ⚠️  ${result.warning}`);
      }
    } else {
      console.log(`❌ MISSING`);
      allTablesExist = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60) + '\n');

  const existingTables = Object.entries(results).filter(([_, v]) => v.exists);
  const missingTables = Object.entries(results).filter(([_, v]) => !v.exists);

  console.log(`✅ Existing tables: ${existingTables.length}/${requiredTables.length}`);
  existingTables.forEach(([table]) => console.log(`   - ${table}`));

  if (missingTables.length > 0) {
    console.log(`\n❌ Missing tables: ${missingTables.length}/${requiredTables.length}`);
    missingTables.forEach(([table]) => console.log(`   - ${table}`));

    console.log('\n📋 NEXT STEPS:');
    console.log('The following SQL files need to be executed in Supabase:');

    missingTables.forEach(([table]) => {
      if (table === 'collection_goals') {
        console.log('\n1. collection_goals table:');
        console.log('   File: web-app/src/database/schemas/collection_goals_schema.sql');
        console.log('   Run in: Supabase Dashboard > SQL Editor');
      } else if (table === 'user_achievements') {
        console.log('\n2. user_achievements table:');
        console.log('   File: mobile-app/user_achievements_schema.sql');
        console.log('   Run in: Supabase Dashboard > SQL Editor');
      }
    });

    console.log('\n🔗 Supabase SQL Editor URL:');
    console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')}`);
  } else {
    console.log('\n✅ All required tables exist! Database is ready for Phase 1.');
  }

  console.log('\n' + '='.repeat(60));

  return allTablesExist;
}

verifyDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('💥 Error during verification:', err);
    process.exit(1);
  });
