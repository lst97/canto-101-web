import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './lib/i18n.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { queryClient } from './lib/queryClient.ts';
import { router } from './router.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Root element not found');
}
createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<RouterProvider router={router} />
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
