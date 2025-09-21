import type { ReactElement, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { isAppError } from "@/types/errors";

export interface AppErrorBoundaryProps {
  children: ReactNode;
  onHardReset?: () => void; // resets global state (query cache, etc.)
  fallback?: ReactNode;
}

function DefaultFallback({ error, reset }: { error: unknown; reset: () => void }): ReactElement {
  const { t } = useTranslation();
  const isApp = isAppError(error);
  const titleKey = isApp ? `errors.${error.kind}.title` : "errors.unexpected.title";
  const message = isApp ? error.message : (error instanceof Error ? error.message : String(error));
  return (
    <div role="alert" className="mx-auto max-w-2xl rounded-md border border-destructive/40 bg-destructive/5 p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-destructive">{t(titleKey)}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="destructive" onClick={reset}>{t("errors.actions.retry")}</Button>
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children, onHardReset, fallback }: AppErrorBoundaryProps): ReactElement {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        fallback ? <>{fallback}</> : <DefaultFallback error={error} reset={resetErrorBoundary} />
      )}
      onReset={onHardReset}
    >
      {children}
    </ErrorBoundary>
  );
}

export default AppErrorBoundary;
