#!/usr/bin/env node

/**
 * CLI Script to create/reset admin user
 * Usage: node scripts/create-admin.js
 */

const SUPABASE_URL = 'https://jymajpnwthgqcghmkmam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWFqcG53dGhncWNnaG1rbWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTU1OTYsImV4cCI6MjA2OTM3MTU5Nn0.J6dMZX-UCAS7PGCsKyamhQwTaqfBJ662HTWA8KgJCbo';

async function createAdminUser() {
  console.log('🚀 Creating/Resetting admin user...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Admin user created/updated successfully!');
      console.log('\n📋 Admin Credentials:');
      console.log(`   Email: ${data.admin_email}`);
      console.log(`   Password: ${data.admin_password}`);
      console.log(`   User ID: ${data.user_id}\n`);
      console.log('🎯 You can now login with these credentials.');
    } else {
      console.error('❌ Failed to create admin user:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };