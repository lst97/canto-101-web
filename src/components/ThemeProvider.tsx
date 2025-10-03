import { useThemeStore } from '../stores/themeStore.ts';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  if (typeof globalThis.window !== 'undefined') {
    useThemeStore.getState().updateResolvedTheme();
  }

  return <>{children}</>;
};
