import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from '@tanstack/react-router';

import { LyricPronunciationSearch } from '../components/cantoLyr/lyrics-search/index.ts';
import QueryErrorBoundary from '../components/errors/QueryErrorBoundary.tsx';
import type { LyricFilterOptionSets } from '../components/cantoLyr/lyrics-search/LyricSearchBase.tsx';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb.tsx';
import { Card, CardContent } from '../components/ui/card.tsx';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.tsx';
import { useLyricFilterOptions } from '../hooks/useLyricFilterOptions.ts';

const tipKeys = ['digits', 'position', 'filters'] as const;

export default function CantoLyrLyricPronunciationSearch(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: filterOptionsResponse, isLoading: filterOptionsLoading } =
    useLyricFilterOptions();

  const filterOptions = useMemo<LyricFilterOptionSets | undefined>(() => {
    const options = filterOptionsResponse?.data;
    if (!options) return undefined;
    const sortStrings = (values: string[]) =>
      Array.from(
        new Set(values.map(item => item.trim()).filter(item => item.length > 0))
      ).sort((a, b) => a.localeCompare(b));
    const numericYears = options.years
      .filter(year => Number.isFinite(year) && year > 0)
      .map(year => year.toString());
    return {
      themes: sortStrings(options.themes),
      keywords: sortStrings(options.keywords),
      lyricist: sortStrings(options.lyricists),
      artist: sortStrings(options.artists),
      sentiment: sortStrings(options.sentiments),
      year: sortStrings(numericYears),
    } satisfies LyricFilterOptionSets;
  }, [filterOptionsResponse]);

  const handleTabChange = (value: string) => {
    if (value === 'pron') {
      navigate({ to: '/canto-lyr/lyric-search/pronunciation' });
    } else if (value === 'rhyme') {
      navigate({ to: '/canto-lyr/lyric-search/rhyme' });
    }
  };

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
              <BreadcrumbPage>
                {t('cantoLyr.lyricSearch.nav.pron')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t('cantoLyr.lyricSearch.pron.heading')}
            </h1>
            <p className="text-muted-foreground max-w-prose">
              {t('cantoLyr.lyricSearch.pron.description')}
            </p>
          </div>
          <Tabs value="pron" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pron">
                {t('cantoLyr.lyricSearch.nav.pron')}
              </TabsTrigger>
              <TabsTrigger value="rhyme">
                {t('cantoLyr.lyricSearch.nav.rhyme')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>
      </div>
      <section
        aria-label={t('cantoLyr.lyricSearch.pron.tipsHeading')}
        className="space-y-4"
      >
        <Card className="border-border/60 shadow-none">
          <CardContent className="space-y-3 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {t('cantoLyr.lyricSearch.pron.tipsHeading')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('cantoLyr.lyricSearch.pron.tipsDescription')}
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tipKeys.map(key => (
                <li key={key}>{t(`cantoLyr.lyricSearch.pron.tips.${key}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
      <section
        aria-label={t('cantoLyr.lyricSearch.pron.heading')}
        className="space-y-4"
      >
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {t('cantoLyr.lyricSearch.pron.formHeading')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            {t('cantoLyr.lyricSearch.pron.formDescription')}
          </p>
        </div>
        <QueryErrorBoundary>
          <LyricPronunciationSearch
            filterOptions={filterOptions}
            filterOptionsLoading={filterOptionsLoading}
          />
        </QueryErrorBoundary>
      </section>
    </main>
  );
}
