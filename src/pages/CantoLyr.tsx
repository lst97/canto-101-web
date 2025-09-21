import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import CantoLyrWorkflowCard from "@/components/cantoLyr/CantoLyrWorkflowCard";

export default function CantoLyr(): ReactElement {
  const { t } = useTranslation();
  const lexiconWorkflows = [
    {
      eyebrow: t("cantoLyr.pages.pron.heading"),
      title: t("cantoLyr.pron.title"),
      description: t("cantoLyr.pages.pron.preview"),
      to: "/canto-lyr/pronunciation-search",
    },
    {
      eyebrow: t("cantoLyr.pages.rhyme.heading"),
      title: t("cantoLyr.rhyme.title"),
      description: t("cantoLyr.pages.rhyme.preview"),
      to: "/canto-lyr/rhyme-search",
    },
  ];
  const lyricWorkflows = [
    {
      eyebrow: t("cantoLyr.pages.lyrics.heading"),
      title: t("cantoLyr.lyrics.title"),
      description: t("cantoLyr.pages.lyrics.preview"),
      to: "/canto-lyr/lyric-generation",
    },
  ];
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 pt-16 md:px-10 md:pt-20">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("homepage.products.items.cantoLyr.label")}
        </h1>
        <p className="text-muted-foreground max-w-prose">
          {t("homepage.products.items.cantoLyr.description")}
        </p>
      </header>
      <section className="space-y-5" aria-label={t("cantoLyr.pages.overview.lexiconTitle")}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("cantoLyr.pages.overview.lexiconTitle")}
          </h2>
          <p className="text-muted-foreground max-w-prose">
            {t("cantoLyr.pages.overview.lexiconDescription")}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {lexiconWorkflows.map(feature => (
            <CantoLyrWorkflowCard
              key={feature.to}
              eyebrow={feature.eyebrow}
              title={feature.title}
              description={feature.description}
              to={feature.to}
              cta={t("cantoLyr.pages.featureCta")}
            />
          ))}
        </div>
      </section>
      <section className="space-y-5" aria-label={t("cantoLyr.pages.overview.lyricsTitle")}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("cantoLyr.pages.overview.lyricsTitle")}
          </h2>
          <p className="text-muted-foreground max-w-prose">
            {t("cantoLyr.pages.overview.lyricsDescription")}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {lyricWorkflows.map(feature => (
            <CantoLyrWorkflowCard
              key={feature.to}
              eyebrow={feature.eyebrow}
              title={feature.title}
              description={feature.description}
              to={feature.to}
              cta={t("cantoLyr.pages.featureCta")}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
