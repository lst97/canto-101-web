import type { ReactElement, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { isAppError } from "@/types/errors";

export interface QueryErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback */
  fallback?: ReactNode;
}

function DefaultQueryFallback({ error, reset }: { error: unknown; reset: () => void }): ReactElement {
  const { t } = useTranslation();
  const isApp = isAppError(error);
  const message = isApp ? error.message : (error instanceof Error ? error.message : String(error));
  const titleKey = isApp ? `errors.${error.kind}.title` : "errors.unexpected.title";
  return (
    <div role="alert" className="rounded-md border border-border/60 bg-muted/30 p-4 space-y-3">
      <div>
        <h3 className="font-medium">{t(titleKey)}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={reset}>{t("errors.actions.retry")}</Button>
      </div>
    </div>
  );
}

export function QueryErrorBoundary({ children, fallback }: QueryErrorBoundaryProps): ReactElement {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        fallback ? <>{fallback}</> : <DefaultQueryFallback error={error} reset={resetErrorBoundary} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default QueryErrorBoundary;
