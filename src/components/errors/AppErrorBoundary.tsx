import type { ReactElement, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button.tsx';
import { isAppError } from '../../types/errors.ts';

export interface AppErrorBoundaryProps {
  children: ReactNode;
  onHardReset?: () => void; // resets global state (query cache, etc.)
  fallback?: ReactNode;
}

interface AppErrorBoundaryFallbackRenderProps {
  error: unknown;
  resetErrorBoundary: () => void;
  fallback?: ReactNode;
}

function DefaultFallback({
  error,
  reset,
}: Readonly<{
  error: unknown;
  reset: () => void;
}>): Readonly<ReactElement> {
  const { t } = useTranslation();
  const isApp = isAppError(error);
  const titleKey = isApp
    ? `errors.${error.kind}.title`
    : 'errors.unexpected.title';
  let message: string;
  if (isApp) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        role="alert"
        className="mx-auto max-w-2xl rounded-md border border-destructive/40 bg-destructive/5 p-6 space-y-4"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-destructive">
            {t(titleKey)}
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="destructive" onClick={reset}>
            {t('errors.actions.retry')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppErrorBoundaryFallback({
  error,
  reset,
  fallback,
}: Readonly<{
  error: unknown;
  reset: () => void;
  fallback?: ReactNode;
}>): Readonly<ReactElement> {
  if (fallback) {
    return <>{fallback}</>;
  }

  return <DefaultFallback error={error} reset={reset} />;
}

function AppErrorBoundaryFallbackRender({
  error,
  resetErrorBoundary,
  fallback,
}: Readonly<AppErrorBoundaryFallbackRenderProps>): Readonly<ReactElement> {
  return (
    <AppErrorBoundaryFallback
      error={error}
      reset={resetErrorBoundary}
      fallback={fallback}
    />
  );
}

export function AppErrorBoundary({
  children,
  onHardReset,
  fallback,
}: Readonly<AppErrorBoundaryProps>): ReactElement {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <AppErrorBoundaryFallbackRender
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          fallback={fallback}
        />
      )}
      onReset={onHardReset}
    >
      {children}
    </ErrorBoundary>
  );
}

export default AppErrorBoundary;
