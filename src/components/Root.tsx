import type { ReactElement } from 'react';
import { Suspense } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import AppErrorBoundary from './errors/AppErrorBoundary.tsx';
import QueryErrorBoundary from './errors/QueryErrorBoundary.tsx';
import { Header } from './Header.tsx';
import { Footer } from './Footer.tsx';
import { LoadingIndicator } from './ui/loading-indicator.tsx';

export function Root(): ReactElement {
  const { t } = useTranslation();
  return (
    <AppErrorBoundary>
      <div className="relative flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow">
          <Suspense
            fallback={
              <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
                <LoadingIndicator
                  label={t('common.loading')}
                  className="text-muted-foreground"
                />
              </div>
            }
          >
            <QueryErrorBoundary>
              <Outlet />
            </QueryErrorBoundary>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AppErrorBoundary>
  );
}
