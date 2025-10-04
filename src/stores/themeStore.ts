import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  updateResolvedTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (globalThis.window === undefined) return 'light';
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme: Theme) => {
        set({ theme });
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ resolvedTheme });
        applyTheme(resolvedTheme);
      },
      updateResolvedTheme: () => {
        const { theme } = get();
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ resolvedTheme });
        applyTheme(resolvedTheme);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => state => {
        if (state) {
          const resolvedTheme =
            state.theme === 'system' ? getSystemTheme() : state.theme;
          applyTheme(resolvedTheme);
        }
      },
    }
  )
);

// Initialize theme on client side
if (globalThis.window !== undefined) {
  const store = useThemeStore.getState();
  const resolvedTheme =
    store.theme === 'system' ? getSystemTheme() : store.theme;
  applyTheme(resolvedTheme);

  // Listen for system theme changes
  globalThis
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { theme, updateResolvedTheme } = useThemeStore.getState();
      if (theme === 'system') {
        updateResolvedTheme();
      }
    });
}
