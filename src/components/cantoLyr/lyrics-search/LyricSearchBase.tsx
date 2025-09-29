import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from '@tanstack/react-form';

import {
  useAiLyricSearch,
  type LyricsPronOptions,
  type LyricsRhymeOptions,
} from '@/hooks/useLyricSearch';
import type { LyricLine, LyricSearchResponse } from '@/lib/schemas/lexicon.ts';

import { stripSpacesPunctAndSymbols } from './base/text-helpers';
import { LyricSearchProvider } from './base/LyricSearchContext';
import { FilterMultiSelectField } from './base/FilterMultiSelectField';
import { ResultsSummary } from './base/ResultsSummary';
import { LyricResultCard } from './base/LyricResultCard';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { LoadingIndicator } from '@/components/ui/loading-indicator.tsx';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { SearchableSelect } from '@/components/ui/searchable-select.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

// Public types used by pages
export type LyricFilterKey = keyof LyricsPronOptions | keyof LyricsRhymeOptions;

type FilterFieldType = 'text' | 'number' | 'single-select' | 'multi-select';

export interface FilterFieldConfig {
  key: LyricFilterKey;
  labelKey: string;
  placeholderKey?: string;
  descriptionKey?: string;
  fieldType?: FilterFieldType;
  optionKey?: LyricFilterKey;
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

export type LyricFilterOptionSets = Partial<Record<LyricFilterKey, string[]>>;

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
  filterOptions?: LyricFilterOptionSets;
  filterOptionsLoading?: boolean;
  isAiSearch?: boolean;
  aiQueryPlaceholderKey?: string;
}

export function LyricSearchBase({
  kind,
  querySchema,
  placeholderKey,
  resultsLabelKey,
  filterFields,
  inputProps,
  filterOptions,
  filterOptionsLoading = false,
  isAiSearch = false,
  aiQueryPlaceholderKey,
}: LyricSearchBaseProps): ReactElement {
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
  const [aiQuery, setAiQuery] = useState<string>('');

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
      let newItems = lyricResult.items;

      // Deduplicate based on normalized lyric text (remove spaces and symbols)
      const seen = new Set<string>();
      newItems = newItems.filter(item => {
        const normalized = stripSpacesPunctAndSymbols(item.text);
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });

      if (page === 0) return newItems;
      if (newItems.length === 0) return prev;
      const map = new Map(prev.map(item => [item.id, item] as const));
      for (const item of newItems) map.set(item.id, item);
      return Array.from(map.values());
    });
  }, [lyricResult, loading, page]);

  const hasMore = entries.length < totalCount;

  const typedOptions = useMemo(
    () => options as unknown as Record<string, unknown>,
    [options]
  );
  const optionSets = useMemo(() => filterOptions ?? {}, [filterOptions]);

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
      if (!result.success) return result.error.issues[0]?.message;
      return undefined;
    },
    [querySchema]
  );

  const handleLoadMore = useCallback(() => {
    if (!loading) setPage(page + 1);
  }, [loading, page, setPage]);

  const handleClearFilters = useCallback(() => {
    const defaults = initialOptionsRef.current as unknown as Record<
      string,
      unknown
    >;
    Object.keys(defaults).forEach(key => {
      const value = defaults[key];
      updateOption(key, value ?? '');
    });
  }, [updateOption]);

  const handleReset = useCallback(() => {
    setSubmitAttempted(false);
    setAiQuery('');
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
      const fieldType = field.fieldType ?? 'text';
      let formatted = value.trim();
      if (fieldType === 'multi-select') {
        formatted = value
          .split(',')
          .map(part => part.trim())
          .filter(part => part.length > 0)
          .join(', ');
      }
      if (formatted.length > 0) entries.push([field.labelKey, formatted]);
    }
    return entries;
  }, [filterFields, typedOptions]);

  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="space-y-6">
        <form
          className="space-y-6"
          onSubmit={event => {
            event.preventDefault();
            event.stopPropagation();
            setSubmitAttempted(true);
            void form.handleSubmit();
          }}
        >
          <div className="space-y-2">
            {isAiSearch && (
              <div className="space-y-2">
                <Label htmlFor={`lyric-${kind}-ai-query`}>
                  {t('cantoLyr.lyricSearch.labels.aiQuery')}
                </Label>
                <Input
                  id={`lyric-${kind}-ai-query`}
                  placeholder={
                    aiQueryPlaceholderKey
                      ? t(aiQueryPlaceholderKey)
                      : t('cantoLyr.lyricSearch.placeholders.aiQuery')
                  }
                  value={aiQuery}
                  onChange={event => setAiQuery(event.target.value)}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
            )}
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
                          className="mt-2 text-xs text-destructive"
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
                  {filterFields.map(field => {
                    const {
                      key,
                      labelKey,
                      placeholderKey: phKey,
                      descriptionKey,
                      inputProps: fieldInputProps,
                      fieldType = 'text',
                      optionKey,
                    } = field;
                    const fieldId = `lyric-${kind}-filter-${String(key)}`;
                    const rawValue = typedOptions[key as string];
                    const value =
                      typeof rawValue === 'string'
                        ? rawValue
                        : String(rawValue ?? '');
                    const optionsForField = optionSets[optionKey ?? key] ?? [];
                    const isOptionsLoading =
                      filterOptionsLoading && optionsForField.length === 0;

                    if (
                      fieldType === 'single-select' &&
                      (optionsForField.length > 0 || isOptionsLoading)
                    ) {
                      if (optionsForField.length === 0 && !isOptionsLoading) {
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
                      return (
                        <div key={fieldId} className="space-y-2">
                          <Label htmlFor={fieldId}>{t(labelKey)}</Label>
                          <SearchableSelect
                            options={optionsForField}
                            value={value}
                            onValueChange={selected =>
                              updateOption(key as string, selected)
                            }
                            placeholder={
                              phKey
                                ? t(phKey)
                                : t('common.any', { defaultValue: 'Any' })
                            }
                            disabled={
                              optionsForField.length === 0 && !isOptionsLoading
                            }
                            loading={isOptionsLoading}
                          />
                          {descriptionKey && (
                            <p className="text-xs text-muted-foreground">
                              {t(descriptionKey)}
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (fieldType === 'multi-select') {
                      if (optionsForField.length === 0 && !isOptionsLoading) {
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
                      return (
                        <FilterMultiSelectField
                          key={fieldId}
                          id={fieldId}
                          label={t(labelKey)}
                          description={
                            descriptionKey ? t(descriptionKey) : undefined
                          }
                          placeholder={
                            phKey
                              ? t(phKey)
                              : t('common.select', { defaultValue: 'Select' })
                          }
                          options={optionsForField}
                          value={value}
                          onChange={selected =>
                            updateOption(key as string, selected)
                          }
                          loading={isOptionsLoading}
                        />
                      );
                    }

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
                  })}
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
            <LyricSearchProvider value={{ kind, queryText: currentQueryText }}>
              <ScrollArea className="h-[900px]">
                <div
                  className="space-y-4"
                  role="region"
                  aria-label={resultsAriaLabel}
                >
                  {entries.map(line => (
                    <LyricResultCard key={line.id} line={line} />
                  ))}
                  {entries.length === 0 && !loading && lyricResult && (
                    <p className="text-sm text-muted-foreground">
                      {t('cantoLyr.lyricSearch.messages.noMatches')}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </LyricSearchProvider>
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
                  t('common.loadMore', {
                    count: Number(typedOptions['pageSize']) || 25,
                  })
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

export default LyricSearchBase;
