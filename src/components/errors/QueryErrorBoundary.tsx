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

function DefaultQueryFallback({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}): ReactElement {
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

export function QueryErrorBoundary({
  children,
  fallback,
}: QueryErrorBoundaryProps): ReactElement {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) =>
        fallback ? (
          <>{fallback}</>
        ) : (
          <DefaultQueryFallback error={error} reset={resetErrorBoundary} />
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default QueryErrorBoundary;
