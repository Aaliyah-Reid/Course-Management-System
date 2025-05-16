import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'default' | 'calm' | 'subtle' | 'neon' | 'mature' | 'ocean';
export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'default',
      mode: 'light',
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
      setMode: (mode) => {
        set({ mode });
        document.documentElement.setAttribute('data-mode', mode);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme);
          document.documentElement.setAttribute('data-mode', state.mode);
        }
      },
    }
  )
);