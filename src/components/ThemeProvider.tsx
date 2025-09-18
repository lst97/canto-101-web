import { useEffect } from "react";
import { useThemeStore } from "../stores/themeStore";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { updateResolvedTheme } = useThemeStore();

  useEffect(() => {
    // Ensure theme is properly initialized on mount
    updateResolvedTheme();
  }, [updateResolvedTheme]);

  return <>{children}</>;
};
