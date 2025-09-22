import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { LyricSession } from "@/components/cantoLyr/LyricGeneration";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CantoLyrLyricGeneration(): ReactElement {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 pb-24 pt-16 md:px-10 md:pt-20">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/canto-lyr">CantoLyr</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("cantoLyr.pages.lyrics.heading")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t("cantoLyr.pages.lyrics.heading")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("cantoLyr.lyrics.title")}
          </h1>
          <p className="text-muted-foreground max-w-prose">
            {t("cantoLyr.pages.lyrics.description")}
          </p>
        </header>
      </div>
      <section aria-label={t("cantoLyr.lyrics.title")}>
        <LyricSession />
      </section>
    </main>
  );
}
