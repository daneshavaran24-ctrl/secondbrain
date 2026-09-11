"use client";
import { useTheme } from 'next-themes';

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle Theme"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      style={{
        padding: 8,
        borderRadius: 8,
        border: '1px solid #ccc',
        margin: 8,
        background: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
      }}
    >
      {theme === 'dark' ? '☀️ حالت روشن' : '🌙 حالت تاریک'}
    </button>
  );
}