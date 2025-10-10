import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type Theme, useThemeStore } from '../stores/themeStore.ts';

export const ThemeToggle = () => {
	const { theme, setTheme } = useThemeStore();
	const { t } = useTranslation();

	const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
		{
			value: 'light',
			label: t('theme.light', 'Light'),
			icon: <Sun className="h-4 w-4" />,
		},
		{
			value: 'dark',
			label: t('theme.dark', 'Dark'),
			icon: <Moon className="h-4 w-4" />,
		},
		{
			value: 'system',
			label: t('theme.system', 'System'),
			icon: <Monitor className="h-4 w-4" />,
		},
	];

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm font-medium">{t('theme.theme', 'Theme')}:</span>
			<div className="flex gap-1">
				{themes.map(({ value, label, icon }) => (
					<button
						key={value}
						type="button"
						onClick={() => setTheme(value)}
						className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
							theme === value
								? 'bg-primary text-primary-foreground'
								: 'hover:bg-muted'
						}`}
						title={label}
					>
						{icon}
						<span className="hidden sm:inline">{label}</span>
					</button>
				))}
			</div>
		</div>
	);
};
