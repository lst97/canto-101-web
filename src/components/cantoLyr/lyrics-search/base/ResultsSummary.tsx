import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge.tsx';

export interface ResultsSummaryProps {
  shown: number;
  total: number;
  cached: boolean;
  queryText: string;
  processingTimeMs: number | null;
}

export function ResultsSummary({
  shown,
  total,
  cached,
  queryText,
  processingTimeMs,
}: ResultsSummaryProps): ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {total > 0 && (
          <span className="font-semibold text-foreground">
            {t('cantoLyr.lyricSearch.results.count', {
              shown: shown.toLocaleString(),
              total: total.toLocaleString(),
            })}
          </span>
        )}
        {cached && (
          <Badge
            variant="outline"
            className="text-[11px] uppercase tracking-wide"
          >
            {t('cantoLyr.lyricSearch.results.cached')}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
        {queryText && (
          <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-muted-foreground/90">
            {queryText}
          </span>
        )}
        {typeof processingTimeMs === 'number' && (
          <span>
            {t('cantoLyr.lyricSearch.results.timing', {
              ms: processingTimeMs.toLocaleString(),
            })}
          </span>
        )}
      </div>
    </div>
  );
}

export default ResultsSummary;
