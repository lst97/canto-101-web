import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import CantoLyrWorkflowCard from '../components/cantoLyr/CantoLyrWorkflowCard.tsx';

interface WorkflowFeature {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
  showBadge?: boolean;
}

export default function CantoLyr(): ReactElement {
  const { t } = useTranslation();
  const lexiconWorkflows: WorkflowFeature[] = [
    {
      eyebrow: t('cantoLyr.pages.pron.heading'),
      title: t('cantoLyr.pron.title'),
      description: t('cantoLyr.pages.pron.preview'),
      to: '/canto-lyr/pronunciation-search',
    },
    {
      eyebrow: t('cantoLyr.pages.rhyme.heading'),
      title: t('cantoLyr.rhyme.title'),
      description: t('cantoLyr.pages.rhyme.preview'),
      to: '/canto-lyr/rhyme-search',
    },
  ];
  const lyricWorkflows: WorkflowFeature[] = [
    {
      eyebrow: t('cantoLyr.pages.lyricSearch.heading'),
      title: t('cantoLyr.lyricSearch.title'),
      description: t('cantoLyr.pages.lyricSearch.preview'),
      to: '/canto-lyr/lyric-search/pronunciation',
    },
  ];
  // lyric workflows moved to AI tools section
  const aiTools: WorkflowFeature[] = [
    {
      eyebrow: t('cantoLyr.pages.ai.heading'),
      title: t('cantoLyr.ai.lyrics.title'),
      description: t('cantoLyr.pages.ai.lyricsPreview'),
      to: '/canto-lyr/lyric-generation',
      showBadge: true,
    },
    {
      // lexicon has a more specific tag
      eyebrow: t('cantoLyr.pages.ai.lexiconTag'),
      title: t('cantoLyr.ai.lexicon.title'),
      description: t('cantoLyr.pages.ai.lexiconPreview'),
      to: '/canto-lyr/ai-lexicon-search',
      showBadge: true,
    },
  ];
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 pt-16 md:px-10 md:pt-20">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('homepage.products.items.cantoLyr.label')}
        </h1>
        <p className="text-muted-foreground max-w-prose">
          {t('homepage.products.items.cantoLyr.description')}
        </p>
      </header>
      <section
        className="space-y-5"
        aria-label={t('cantoLyr.pages.overview.lexiconTitle')}
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('cantoLyr.pages.overview.lexiconTitle')}
          </h2>
          <p className="text-muted-foreground max-w-prose">
            {t('cantoLyr.pages.overview.lexiconDescription')}
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
              cta={t('cantoLyr.pages.featureCta')}
            />
          ))}
        </div>
      </section>
      <section
        className="space-y-5"
        aria-label={t('cantoLyr.pages.overview.lyricSearchTitle')}
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('cantoLyr.pages.overview.lyricSearchTitle')}
          </h2>
          <p className="text-muted-foreground max-w-prose">
            {t('cantoLyr.pages.overview.lyricSearchDescription')}
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
              cta={t('cantoLyr.pages.featureCta')}
              showBadge={Boolean(feature.showBadge)}
            />
          ))}
        </div>
      </section>
      {/* lyrics section moved into AI tools */}
      <section className="space-y-5" aria-label={t('cantoLyr.pages.ai.title')}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('cantoLyr.pages.ai.title')}
          </h2>
          <p className="text-muted-foreground max-w-prose">
            {t('cantoLyr.pages.ai.description')}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {aiTools.map(feature => (
            <CantoLyrWorkflowCard
              key={feature.to}
              eyebrow={feature.eyebrow}
              title={feature.title}
              description={feature.description}
              to={feature.to}
              cta={t('cantoLyr.pages.featureCta')}
              showBadge={Boolean(feature.showBadge)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
