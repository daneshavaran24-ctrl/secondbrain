// Returns the current authenticated user's ID dynamically
export function getActiveUserId(): string {
  try {
    const raw = localStorage.getItem('mora_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.id) return user.id;
    }
  } catch {}
  return '00000000-0000-0000-0000-000000000001';
}

// Legacy alias — kept for backward compat during migration
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';
