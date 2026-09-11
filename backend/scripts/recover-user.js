/**
 * User Recovery Script
 * Usage: node scripts/recover-user.js <email> [tempPassword]
 *
 * - If user exists (active or inactive): reactivates, repairs missing profile/role, resets password
 * - If user does not exist: creates it with role 'user'
 * Output: prints new credentials to console
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/db/index.js';

const email = process.argv[2];
const tempPassword = process.argv[3] || 'Mora@1234';

if (!email) {
  console.error('Usage: node scripts/recover-user.js <email> [tempPassword]');
  process.exit(1);
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Check existing user ────────────────────────────────────────────
    const existing = await client.query(
      'SELECT id, email, is_active FROM users WHERE email = $1',
      [email]
    );

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      const wasActive = existing.rows[0].is_active;

      // Reactivate + reset password
      await client.query(
        'UPDATE users SET is_active = TRUE, password_hash = $1, email_verified = TRUE, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );
      console.log(`\n✓ User found (was ${wasActive ? 'active' : 'INACTIVE'}) — reactivated & password reset`);
    } else {
      // ── 2. Create new user ──────────────────────────────────────────────
      const newUser = await client.query(
        'INSERT INTO users (email, password_hash, is_active, email_verified) VALUES ($1, $2, TRUE, TRUE) RETURNING id',
        [email, passwordHash]
      );
      userId = newUser.rows[0].id;
      console.log('\n✓ User did not exist — created new account');
    }

    // ── 3. Ensure user_profile exists ─────────────────────────────────────
    const profile = await client.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);
    if (profile.rows.length === 0) {
      const displayName = email.split('@')[0];
      await client.query(
        'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
        [userId, displayName]
      );
      console.log('✓ Profile created');
    } else {
      console.log('✓ Profile already exists');
    }

    // ── 4. Ensure user_roles exists ───────────────────────────────────────
    const role = await client.query('SELECT id FROM user_roles WHERE user_id = $1', [userId]);
    if (role.rows.length === 0) {
      await client.query(
        "INSERT INTO user_roles (user_id, system_role) VALUES ($1, 'user')",
        [userId]
      );
      console.log('✓ Role assigned: user');
    } else {
      console.log(`✓ Role exists: ${role.rows[0].system_role || 'user'}`);
    }

    // ── 5. Invalidate old sessions ────────────────────────────────────────
    await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    console.log('\n─────────────────────────────────');
    console.log('  Recovery complete');
    console.log(`  Email    : ${email}`);
    console.log(`  Password : ${tempPassword}`);
    console.log(`  User ID  : ${userId}`);
    console.log('─────────────────────────────────\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
