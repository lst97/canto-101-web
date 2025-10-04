import type { ReactElement, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button.tsx';
import { ApiErrorDisplay as ApiErrorDisplayComponent } from './ApiErrorDisplay';

export interface QueryErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback */
  fallback?: ReactNode;
}

interface QueryErrorBoundaryFallbackRenderProps {
  error: unknown;
  resetErrorBoundary: () => void;
  fallback?: ReactNode;
}

function DefaultQueryFallback({
  error,
  reset,
}: Readonly<{ error: unknown; reset: () => void }>): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div
        role="alert"
        className="w-full max-w-2xl rounded-md border border-border/60 bg-muted/30 p-4 space-y-3"
      >
        <ApiErrorDisplayComponent
          error={error}
          title={t('errors.query.title', 'Query Error')}
          showTechnicalDetails={false}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={reset}>
            {t('errors.actions.retry')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function QueryErrorBoundaryFallbackRender({
  error,
  resetErrorBoundary,
  fallback,
}: Readonly<QueryErrorBoundaryFallbackRenderProps>): Readonly<ReactElement> {
  if (fallback) {
    return <>{fallback}</>;
  }

  return <DefaultQueryFallback error={error} reset={resetErrorBoundary} />;
}

export function QueryErrorBoundary({
  children,
  fallback,
}: Readonly<QueryErrorBoundaryProps>): ReactElement {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <QueryErrorBoundaryFallbackRender
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          fallback={fallback}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default QueryErrorBoundary;
