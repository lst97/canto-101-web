import { Outlet, useRouterState } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useI18nLoadingStore } from '../stores/i18nLoadingStore.ts';
import AppErrorBoundary from './errors/AppErrorBoundary.tsx';
import { Footer } from './Footer.tsx';
import { Header } from './Header.tsx';
import { LoadingIndicator } from './ui/loading-indicator.tsx';
import { ScrollArea } from './ui/scroll-area.tsx';

export function Root(): ReactElement {
	const routerState = useRouterState();
	const isI18nLoading = useI18nLoadingStore((state) => state.isLoading);

	const [activeFallbacks, setActiveFallbacks] = useState(0);
	const [overlayVisible, setOverlayVisible] = useState(false);

	const handleFallbackToggle = useCallback((isActive: boolean) => {
		setActiveFallbacks((prev) => {
			if (isActive) {
				return prev + 1;
			}
			return prev > 0 ? prev - 1 : 0;
		});
	}, []);

	const locationKey = useMemo(
		() =>
			`${routerState.location.pathname}${routerState.location.search}${routerState.location.hash}`,
		[
			routerState.location.hash,
			routerState.location.pathname,
			routerState.location.search,
		],
	);

	const resolvedLocationKey = useMemo(() => {
		const resolved = routerState.resolvedLocation ?? routerState.location;
		return `${resolved.pathname}${resolved.search}${resolved.hash}`;
	}, [routerState.location, routerState.resolvedLocation]);

	const navigationPending =
		routerState.status === 'pending' ||
		routerState.isLoading ||
		routerState.isTransitioning ||
		(routerState.pendingMatches?.length ?? 0) > 0 ||
		locationKey !== resolvedLocationKey;

	const navigationOverlayActive = navigationPending || activeFallbacks > 0;

	useEffect(() => {
		if (navigationOverlayActive) {
			setOverlayVisible(true);
			return;
		}

		if (globalThis.window === undefined) {
			setOverlayVisible(false);
			return;
		}

		const timeout = globalThis.window.setTimeout(() => {
			setOverlayVisible(false);
		}, 180);

		return () => {
			globalThis.window.clearTimeout(timeout);
		};
	}, [navigationOverlayActive]);

	return (
		<div className="relative flex flex-col min-h-screen bg-background text-foreground">
			<Header />
			<main className="relative flex-grow overflow-hidden">
				<ScrollArea className="h-full">
					<AppErrorBoundary>
						<Suspense
							fallback={
								<NavigationSuspenseFallback onToggle={handleFallbackToggle} />
							}
						>
							<Outlet />
						</Suspense>
					</AppErrorBoundary>
				</ScrollArea>
				{overlayVisible ? (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
						<LoadingIndicator variant="navigation" className="max-w-2xl" />
					</div>
				) : null}
			</main>
			<Footer />
			{isI18nLoading ? (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur">
					<LoadingIndicator variant="navigation" className="max-w-2xl" />
				</div>
			) : null}
		</div>
	);
}

interface NavigationSuspenseFallbackProps {
	onToggle: (active: boolean) => void;
}

function NavigationSuspenseFallback({
	onToggle,
}: Readonly<NavigationSuspenseFallbackProps>): ReactElement {
	useEffect(() => {
		onToggle(true);
		return () => onToggle(false);
	}, [onToggle]);

	return (
		<div className="flex items-center justify-center px-6 py-12">
			<LoadingIndicator variant="navigation" className="max-w-2xl" />
		</div>
	);
}
