import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';

import { LexiconAiSearch } from '../components/cantoLyr/lexicon/index.ts';
import QueryErrorBoundary from '../components/errors/QueryErrorBoundary.tsx';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb.tsx';
import { Card, CardContent } from '../components/ui/card.tsx';

export default function CantoLyrAiLexiconSearch(): ReactElement {
  const { t } = useTranslation();

  const guidanceSteps = [
    t('cantoLyr.pages.aiLexicon.steps.one'),
    t('cantoLyr.pages.aiLexicon.steps.two'),
    t('cantoLyr.pages.aiLexicon.steps.three'),
  ];

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
              <BreadcrumbPage>{t('cantoLyr.ai.lexicon.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('cantoLyr.ai.lexicon.title')}
          </h1>
          <p className="text-muted-foreground max-w-prose">
            {t('cantoLyr.pages.aiLexicon.description')}
          </p>
        </header>
      </div>
      <section
        className="space-y-4"
        aria-label={t('cantoLyr.pages.aiLexicon.stepsHeading')}
      >
        <Card className="border-border/60 bg-muted/20 shadow-none">
          <CardContent className="space-y-4 px-6">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              {t('cantoLyr.pages.aiLexicon.stepsHeading')}
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {guidanceSteps.map(step => (
                <li key={step} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground/80">
              {t('cantoLyr.pages.aiLexicon.notice')}
            </p>
          </CardContent>
        </Card>
      </section>
      <section
        aria-label={t('cantoLyr.ai.lexicon.title')}
        className="space-y-4"
      >
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {t('cantoLyr.pages.aiLexicon.formHeading')}
          </h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            {t('cantoLyr.pages.aiLexicon.formDescription')}
          </p>
        </div>
        <QueryErrorBoundary>
          <LexiconAiSearch />
        </QueryErrorBoundary>
      </section>
    </main>
  );
}
