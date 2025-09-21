import type { ReactElement } from "react";
import { Suspense } from "react";
import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import AppErrorBoundary from "@/components/errors/AppErrorBoundary";
import QueryErrorBoundary from "@/components/errors/QueryErrorBoundary";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

export function Root(): ReactElement {
  const { t } = useTranslation();
  return (
    <AppErrorBoundary>
      <div className="relative min-h-screen bg-background text-foreground">
        <Header />
        <main>
          <Suspense
            fallback={
              <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
                <LoadingIndicator
                  label={t("common.loading")}
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
