import React from 'react';
import { useThemeStore, ThemeName, ThemeMode } from '../../utils/theme';

const themes: { value: ThemeName; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'calm', label: 'Calm' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'neon', label: 'Neon' },
  { value: 'mature', label: 'Mature' },
  { value: 'ocean', label: 'Ocean' },
];

const modes: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

interface PreferencesPageProps {}

const PreferencesPage: React.FC<PreferencesPageProps> = () => {
  const { theme, mode, setTheme, setMode } = useThemeStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="max-w-3xl mx-auto">
        <div className="bg-theme-background shadow rounded-lg border border-theme-primary/20">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold text-theme-text mb-6">Preferences</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-theme-text mb-4">Theme Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-theme-text">Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as ThemeName)}
                      className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
                    >
                      {themes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-theme-text">Mode</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as ThemeMode)}
                      className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
                    >
                      {modes.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;