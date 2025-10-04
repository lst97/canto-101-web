import {
  type InputHTMLAttributes,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

import {
  type LyricsPronOptions,
  type LyricsRhymeOptions,
  useAiLyricSearch,
} from '../../../hooks/useLyricSearch.ts';
import type {
  LyricLine,
  LyricSearchResponse,
} from '../../../lib/schemas/lyric.ts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion.tsx';
import { Badge } from '../../ui/badge.tsx';
import { Button } from '../../ui/button.tsx';
import { Card, CardContent } from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { LoadingIndicator } from '../../ui/loading-indicator.tsx';
import { Separator } from '../../ui/separator.tsx';

type LyricFilterKey = keyof LyricsPronOptions | keyof LyricsRhymeOptions;

interface FilterFieldConfig {
  key: LyricFilterKey;
  labelKey: string;
  placeholderKey?: string;
  descriptionKey?: string;
  inputProps?: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    | 'inputMode'
    | 'pattern'
    | 'autoCapitalize'
    | 'autoCorrect'
    | 'type'
    | 'min'
    | 'max'
    | 'step'
  >;
}

export interface LyricSearchBaseProps {
  kind: 'lyrics-pron' | 'lyrics-rhyme';
  querySchema: z.ZodSchema<{ query: string }>;
  placeholderKey: string;
  resultsLabelKey: string;
  filterFields: FilterFieldConfig[];
  inputProps?: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'inputMode' | 'pattern' | 'autoCapitalize' | 'autoCorrect'
  >;
}

export function LyricSearchBase({
  kind,
  querySchema,
  placeholderKey,
  resultsLabelKey,
  filterFields,
  inputProps,
}: Readonly<LyricSearchBaseProps>): ReactElement {
  const { t } = useTranslation();
  const {
    query,
    setQuery,
    result,
    error,
    loading,
    search,
    reset,
    page,
    setPage,
    options,
    updateOption,
  } = useAiLyricSearch({ kind });

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [entries, setEntries] = useState<LyricLine[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentQueryText, setCurrentQueryText] = useState<string>('');
  const [responseFromCache, setResponseFromCache] = useState<boolean>(false);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);

  const initialOptionsRef = useRef(options);

  const lyricResult = useMemo<LyricSearchResponse | null>(() => {
    if (!result) return null;
    return result as LyricSearchResponse;
  }, [result]);

  useEffect(() => {
    if (!lyricResult) {
      if (!loading && page === 0) {
        setEntries([]);
        setTotalCount(0);
        setCurrentQueryText('');
        setResponseFromCache(false);
        setProcessingTimeMs(null);
      }
      return;
    }

    setTotalCount(lyricResult.count);
    setCurrentQueryText(lyricResult.query);
    setResponseFromCache(lyricResult.fromCache);
    setProcessingTimeMs(lyricResult.processingTimeMs);

    setEntries(prev => {
      if (page === 0) {
        return lyricResult.items;
      }
      if (lyricResult.items.length === 0) {
        return prev;
      }
      const map = new Map(prev.map(item => [item.id, item]));
      for (const item of lyricResult.items) {
        map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, [lyricResult, loading, page]);

  const hasMore = entries.length < totalCount;

  const typedOptions = useMemo(
    () => options as unknown as Record<string, unknown>,
    [options]
  );

  const form = useForm({
    defaultValues: { query },
    onSubmit: async () => {
      await search();
    },
  });

  useEffect(() => {
    const currentValue = form.getFieldValue('query');
    if (currentValue !== query) {
      form.setFieldValue('query', () => query);
    }
  }, [form, query]);

  const validateQueryValue = useCallback(
    (value: string): string | undefined => {
      const result = querySchema.safeParse({ query: value });
      if (!result.success) {
        return result.error.issues[0]?.message;
      }
      return undefined;
    },
    [querySchema]
  );

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      setPage(page + 1);
    }
  }, [loading, page, setPage]);

  const handleClearFilters = useCallback(() => {
    const defaults = initialOptionsRef.current as unknown as Record<
      string,
      unknown
    >;
    for (const key of Object.keys(defaults)) {
      const value = defaults[key];
      updateOption(key, value ?? '');
    }
  }, [updateOption]);

  const handleReset = useCallback(() => {
    setSubmitAttempted(false);
    reset();
  }, [reset]);

  const resolvedError = useMemo(() => {
    if (!error) return null;
    return error.startsWith('cantoLyr.') ? t(error) : error;
  }, [error, t]);

  const resultsAriaLabel = t(resultsLabelKey, {
    defaultValue: 'Lyric search results',
  });
  const placeholder = t(placeholderKey);

  const activeFilterValues = useMemo(() => {
    const entries: Array<[string, string]> = [];
    for (const field of filterFields) {
      const rawValue = typedOptions[field.key as string];
      const value =
        typeof rawValue === 'string' ? rawValue : String(rawValue ?? '');
      if (value.trim().length > 0) {
        entries.push([field.labelKey, value.trim()]);
      }
    }
    return entries;
  }, [filterFields, typedOptions]);

  const renderPronunciationBigrams = useCallback(
    (line: LyricLine) => {
      if (
        !line.pronunciationBigrams ||
        line.pronunciationBigrams.length === 0
      ) {
        return null;
      }
      return (
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('cantoLyr.lyricSearch.labels.bigrams')}
          </span>
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            {line.pronunciationBigrams.map(bigram => (
              <span
                key={`${bigram.value}-${bigram.position}`}
                className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono"
              >
                {bigram.position + 1}. {bigram.value}
              </span>
            ))}
          </div>
        </div>
      );
    },
    [t]
  );

  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="space-y-6">
        <form
          className="space-y-6"
          onSubmit={event => {
            event.preventDefault();
            event.stopPropagation();
            setSubmitAttempted(true);
            form.handleSubmit();
          }}
        >
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row">
              <form.Field
                name="query"
                validators={{
                  onChange: ({ value }) => validateQueryValue(value),
                  onSubmit: ({ value }) => validateQueryValue(value),
                }}
              >
                {field => {
                  const showFieldError =
                    field.state.meta.errors.length > 0 &&
                    (field.state.meta.isTouched ||
                      field.state.meta.isDirty ||
                      submitAttempted);
                  const errorKey = field.state.meta.errors[0];
                  return (
                    <div className="flex-1">
                      <Label
                        htmlFor={`lyric-${kind}-query`}
                        className="sr-only"
                      >
                        {t('cantoLyr.lyricSearch.labels.query')}
                      </Label>
                      <Input
                        id={`lyric-${kind}-query`}
                        placeholder={placeholder}
                        value={field.state.value}
                        onChange={event => {
                          const nextValue = event.target.value;
                          field.handleChange(nextValue);
                          setQuery(nextValue);
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={showFieldError}
                        aria-describedby={
                          showFieldError
                            ? `lyric-${kind}-query-error`
                            : undefined
                        }
                        inputMode={inputProps?.inputMode}
                        pattern={inputProps?.pattern}
                        autoCapitalize={inputProps?.autoCapitalize}
                        autoCorrect={inputProps?.autoCorrect}
                      />
                      {showFieldError && errorKey && (
                        <p
                          id={`lyric-${kind}-query-error`}
                          className="mt-2 text-xs text-destructive px-2"
                          role="alert"
                        >
                          {t(errorKey)}
                        </p>
                      )}
                    </div>
                  );
                }}
              </form.Field>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={loading} className="px-6">
                  {loading ? (
                    <LoadingIndicator
                      size="sm"
                      label={t('common.loading')}
                      spinnerClassName="text-primary-foreground"
                      labelClassName="text-primary-foreground"
                    />
                  ) : (
                    t('common.search')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={loading && page === 0}
                >
                  {t('common.reset', { defaultValue: 'Reset' })}
                </Button>
              </div>
            </div>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="filters">
              <AccordionTrigger className="text-sm font-medium">
                {t('cantoLyr.lyricSearch.filters.label')}
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {filterFields.map(
                    ({
                      key,
                      labelKey,
                      placeholderKey: phKey,
                      descriptionKey,
                      inputProps: fieldInputProps,
                    }) => {
                      const fieldId = `lyric-${kind}-filter-${String(key)}`;
                      const rawValue = typedOptions[key as string];
                      const value =
                        typeof rawValue === 'string'
                          ? rawValue
                          : String(rawValue ?? '');
                      return (
                        <div key={fieldId} className="space-y-2">
                          <Label htmlFor={fieldId}>{t(labelKey)}</Label>
                          <Input
                            id={fieldId}
                            value={value}
                            placeholder={phKey ? t(phKey) : undefined}
                            onChange={event =>
                              updateOption(key as string, event.target.value)
                            }
                            {...fieldInputProps}
                          />
                          {descriptionKey && (
                            <p className="text-xs text-muted-foreground">
                              {t(descriptionKey)}
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {activeFilterValues.map(([labelKey, value]) => (
                      <Badge
                        key={`${labelKey}-${value}`}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        <span className="font-semibold text-muted-foreground/80">
                          {t(labelKey)}:
                        </span>
                        <span className="ml-1 text-foreground">{value}</span>
                      </Badge>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    {t('cantoLyr.lyricSearch.filters.reset')}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
        {resolvedError && (
          <p className="text-sm text-destructive" role="alert">
            {resolvedError}
          </p>
        )}
        {(entries.length > 0 || loading || lyricResult) && (
          <div className="space-y-4" aria-live={loading ? 'polite' : 'off'}>
            {(totalCount > 0 || loading) && (
              <ResultsSummary
                total={totalCount}
                shown={entries.length}
                cached={responseFromCache}
                queryText={currentQueryText}
                processingTimeMs={processingTimeMs}
              />
            )}
            <section className="space-y-4" aria-label={resultsAriaLabel}>
              {entries.map(line => (
                <LyricResultCard
                  key={line.id}
                  line={line}
                  renderBigrams={renderPronunciationBigrams}
                />
              ))}
              {entries.length === 0 && !loading && lyricResult && (
                <p className="text-sm text-muted-foreground">
                  {t('cantoLyr.lyricSearch.messages.noMatches')}
                </p>
              )}
            </section>
            {hasMore && (
              <Button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full justify-center"
              >
                {loading ? (
                  <LoadingIndicator
                    size="sm"
                    label={t('common.loading')}
                    spinnerClassName="text-primary-foreground"
                    labelClassName="text-primary-foreground"
                  />
                ) : (
                  t('common.loadMore')
                )}
              </Button>
            )}
            {!hasMore && entries.length > 0 && !loading && (
              <p className="text-xs text-muted-foreground">
                {t('cantoLyr.lyricSearch.messages.endOfResults')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResultsSummaryProps {
  shown: number;
  total: number;
  cached: boolean;
  queryText: string;
  processingTimeMs: number | null;
}

function ResultsSummary({
  shown,
  total,
  cached,
  queryText,
  processingTimeMs,
}: Readonly<ResultsSummaryProps>): ReactElement {
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

interface LyricResultCardProps {
  line: LyricLine;
  renderBigrams: (line: LyricLine) => ReactElement | null;
}

function LyricResultCard({
  line,
  renderBigrams,
}: Readonly<LyricResultCardProps>): ReactElement {
  const { t } = useTranslation();
  const hasThemes =
    Array.isArray(line.themes) && line.themes && line.themes.length > 0;
  const hasKeywords =
    Array.isArray(line.keywords) && line.keywords && line.keywords.length > 0;

  return (
    <div className="rounded-lg border border-border/60 bg-card/70 p-4 shadow-sm transition-colors hover:border-primary/60">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold leading-relaxed text-foreground">
              {line.text}
            </p>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide text-muted-foreground/80">
                {t('cantoLyr.lyricSearch.labels.song')}
              </span>
              <Separator
                orientation="vertical"
                className="mx-2 inline-flex h-3"
              />
              <span>{line.song.title}</span>
              {typeof line.song.year === 'number' && (
                <span className="ml-2 text-muted-foreground/80">
                  {line.song.year}
                </span>
              )}
            </div>
          </div>
          <Badge
            variant="secondary"
            className="font-mono text-xs uppercase tracking-wide"
          >
            {line.tonePatternText}
          </Badge>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              {t('cantoLyr.lyricSearch.labels.metadata')}
            </span>
            <p>
              {t('cantoLyr.lyricSearch.labels.lineIndex', {
                index: line.lineIndex + 1,
              })}
              <Separator
                orientation="vertical"
                className="mx-2 inline-flex h-3"
              />
              {t('cantoLyr.lyricSearch.labels.counts', {
                chars: line.charCount,
                syllables: line.syllableCount,
                tokens: line.tokenCount,
              })}
            </p>
          </div>
          {renderBigrams(line)}
        </div>
        {(hasThemes || hasKeywords || line.sentiment) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {line.sentiment && (
              <Badge variant="outline" className="uppercase tracking-wide">
                {t('cantoLyr.lyricSearch.labels.sentiment')}: {line.sentiment}
              </Badge>
            )}
            {hasThemes &&
              line.themes?.map(theme => (
                <Badge
                  key={`theme-${theme}`}
                  variant="secondary"
                  className="text-xs lowercase"
                >
                  {theme}
                </Badge>
              ))}
            {hasKeywords &&
              line.keywords?.map(keyword => (
                <Badge
                  key={`keyword-${keyword}`}
                  variant="outline"
                  className="text-xs lowercase"
                >
                  {keyword}
                </Badge>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LyricSearchBase;
export type { FilterFieldConfig };
