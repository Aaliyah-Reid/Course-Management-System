import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../utils/theme';

const ThemeToggle: React.FC = () => {
  // FIXME: This component seems to confuse theme (name) and mode (light/dark).
  // It reads `theme` (which is ThemeName) but tries to toggle it as if it were ThemeMode.
  // It should ideally use `mode` and `setMode` from `useThemeStore` for light/dark toggling.
  const { theme, setTheme, mode, setMode } = useThemeStore();

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-full text-theme-text hover:bg-theme-accent/10 transition-colors"
      aria-label="Toggle theme mode"
    >
      {mode === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;