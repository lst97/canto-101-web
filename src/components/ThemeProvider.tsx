import { useThemeStore } from '../stores/themeStore.ts';

interface ThemeProviderProps {
	children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	if (globalThis.window !== undefined) {
		useThemeStore.getState().updateResolvedTheme();
	}

	return <>{children}</>;
};
