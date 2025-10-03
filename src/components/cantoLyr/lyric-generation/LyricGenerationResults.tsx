import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../ui/badge.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card.tsx';
import { Separator } from '../../ui/separator.tsx';
import type { LyricGenerationResponse } from '../../../lib/schemas/lyric-generation.ts';

import { LyricLinesAccordion } from './LyricLinesAccordion.tsx';
import { TopParagraphList } from './TopParagraphList.tsx';

interface LyricGenerationResultsProps {
  result: LyricGenerationResponse;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function LyricGenerationResults({
  result,
}: Readonly<LyricGenerationResultsProps>) {
  const { t } = useTranslation();
  const metaEntries = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [
      {
        label: t('cantoLyr.ai.lyrics.summary.seed'),
        value: result.meta.seed.toLocaleString(),
      },
      {
        label: t('cantoLyr.ai.lyrics.summary.createdAt'),
        value: formatDate(result.meta.createdAt),
      },
      {
        label: t('cantoLyr.ai.lyrics.summary.lineCount'),
        value: result.meta.lineCount.toLocaleString(),
      },
    ];

    if (typeof result.meta.processingTimeMs === 'number') {
      items.push({
        label: t('cantoLyr.ai.lyrics.summary.processingTime'),
        value: t('cantoLyr.ai.lyrics.summary.processingTimeValue', {
          ms: result.meta.processingTimeMs.toLocaleString(),
        }),
      });
    }

    return items;
  }, [result.meta, t]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>{t('cantoLyr.ai.lyrics.summary.title')}</CardTitle>
          <CardDescription>
            {t('cantoLyr.ai.lyrics.summary.description', {
              feature: result.meta.feature,
              version: result.meta.version,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-wide">
              {t('cantoLyr.ai.lyrics.summary.feature', {
                feature: result.meta.feature,
              })}
            </Badge>
            <Badge variant="outline" className="uppercase tracking-wide">
              {t('cantoLyr.ai.lyrics.summary.version', {
                version: result.meta.version,
              })}
            </Badge>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metaEntries.map(entry => (
              <div
                key={entry.label}
                className="rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {entry.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            {t('cantoLyr.ai.lyrics.topParagraphs.title')}
          </h3>
          <Badge variant="outline" className="text-xs uppercase tracking-wide">
            {t('cantoLyr.ai.lyrics.topParagraphs.count', {
              count: result.topOutputs?.length ?? 0,
            })}
          </Badge>
        </div>
        <TopParagraphList paragraphs={result.topOutputs ?? []} />
      </section>

      <Separator className="bg-border/60" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            {t('cantoLyr.ai.lyrics.lines.sectionTitle')}
          </h3>
          <Badge variant="outline" className="text-xs uppercase tracking-wide">
            {t('cantoLyr.ai.lyrics.lines.count', {
              count: result.lines.length,
            })}
          </Badge>
        </div>
        <LyricLinesAccordion lines={result.lines} />
      </section>
    </div>
  );
}

export default LyricGenerationResults;
