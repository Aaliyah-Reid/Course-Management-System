import React from 'react';
import { useThemeStore } from '../../utils/theme';

const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-theme-text">Theme Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-theme-text">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;