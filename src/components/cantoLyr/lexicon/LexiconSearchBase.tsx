import {
  memo,
  type ReactElement,
  type InputHTMLAttributes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Search, ThumbsDown, ThumbsUp } from 'lucide-react';

import { useLexiconSearch } from '../../../hooks/useLexiconSearch.ts';
import { Badge } from '../../ui/badge.tsx';
import { Button } from '../../ui/button.tsx';
import { Card, CardContent } from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { LoadingIndicator } from '../../ui/loading-indicator.tsx';
import { Toggle } from '../../ui/toggle.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip.tsx';
import { cn } from '../../../lib/utils.ts';
import type {
  LexiconRhymeSearchVariantsResponse,
  LexiconSearchList,
  ReadingItem,
  SearchResponse,
} from '../../../lib/schemas/lexicon.ts';

interface LexiconSearchBaseProps {
  kind: 'pron' | 'rhyme';
  querySchema: z.ZodSchema<{ query: string }>;
  groupSize?: number;
  inputProps?: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'inputMode' | 'pattern' | 'autoCapitalize' | 'autoCorrect'
  >;
}

interface DetailEntry {
  label: string;
  value: string;
  fullWidth?: boolean;
}

const DEFAULT_GROUP_SIZE = 50;

function dedupeById(items: ReadingItem[]): ReadingItem[] {
  const seen = new Set<string>();
  const result: ReadingItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function formatEntryType(
  t: (k: string, opts?: Record<string, unknown>) => string,
  type: ReadingItem['type']
): string {
  return t(`cantoLyr.lexicon.types.${type}`, { defaultValue: type });
}

function formatList(values: string[], separator = ', '): string {
  return values.filter(Boolean).join(separator);
}

function createDetailEntries(
  t: (k: string, opts?: Record<string, unknown>) => string,
  item: ReadingItem
): DetailEntry[] {
  const entries: DetailEntry[] = [
    {
      label: t('cantoLyr.lexicon.details.pronunciation'),
      value: item.pronunciation,
    },
    { label: t('cantoLyr.lexicon.details.tone'), value: item.tone },
    {
      label: t('cantoLyr.lexicon.details.jyutping'),
      value: formatList(item.jyutping, ' · '),
    },
    {
      label: t('cantoLyr.lexicon.details.consonants'),
      value: formatList(item.consonants),
    },
    {
      label: t('cantoLyr.lexicon.details.rhymes'),
      value: formatList(item.rhymes),
    },
    {
      label: t('cantoLyr.lexicon.details.syllables'),
      value: item.syllables.toString(),
    },
    {
      label: t('cantoLyr.lexicon.details.frequency'),
      value: item.freq.toLocaleString(),
    },
    { label: t('cantoLyr.lexicon.details.pos'), value: item.pos },
    { label: t('cantoLyr.lexicon.details.register'), value: item.register },
    {
      label: t('cantoLyr.lexicon.details.gloss'),
      value: item.gloss,
      fullWidth: true,
    },
    {
      label: t('cantoLyr.lexicon.details.source'),
      value: item.source,
      fullWidth: true,
    },
  ];
  return entries.filter(entry => entry.value.trim().length > 0);
}

export function LexiconSearchBase({
  kind,
  querySchema,
  groupSize = DEFAULT_GROUP_SIZE,
  inputProps,
}: LexiconSearchBaseProps): ReactElement {
  const { t } = useTranslation();
  const {
    query,
    setQuery,
    result,
    error,
    loading,
    search,
    page,
    setPage,
    options,
    updateOption,
  } = useLexiconSearch({ kind });
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReadingItem[]>([]);
  const [groups, setGroups] = useState<ReadingItem[][]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentQueryText, setCurrentQueryText] = useState<string>('');
  const [responseFromCache, setResponseFromCache] = useState<boolean>(false);
  const [lastProcessingTimeMs, setLastProcessingTimeMs] = useState<
    number | null
  >(null);
  const resultsScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollSnapshotRef = useRef({ top: 0, height: 0, clientHeight: 0 });
  const isRhymeSearch = kind === 'rhyme';
  const [sequenceView, setSequenceView] = useState<boolean>(false);
  const [inclusiveEntries, setInclusiveEntries] = useState<ReadingItem[]>([]);
  const [sequenceEntries, setSequenceEntries] = useState<ReadingItem[]>([]);
  const [inclusiveTotal, setInclusiveTotal] = useState<number>(0);
  const [sequenceTotal, setSequenceTotal] = useState<number>(0);

  const readingResult = useMemo<SearchResponse | null>(() => {
    if (!result) return null;
    if (kind === 'pron') {
      return result as SearchResponse;
    }
    if (kind === 'rhyme') {
      const maybeVariants = result as LexiconRhymeSearchVariantsResponse;
      if ('inclusive' in maybeVariants || 'sequence' in maybeVariants) {
        return null;
      }
      return result as SearchResponse;
    }
    return null;
  }, [result, kind]);

  const rhymeVariantsResult =
    useMemo<LexiconRhymeSearchVariantsResponse | null>(() => {
      if (!result || !isRhymeSearch) return null;
      const maybeVariants = result as LexiconRhymeSearchVariantsResponse;
      if ('inclusive' in maybeVariants || 'sequence' in maybeVariants) {
        return maybeVariants;
      }
      return null;
    }, [result, isRhymeSearch]);

  const pageSize = useMemo(() => {
    const raw = (options as { pageSize?: string }).pageSize;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return groupSize;
    }
    return parsed;
  }, [options, groupSize]);

  useEffect(() => {
    if (isRhymeSearch) {
      if (!rhymeVariantsResult) {
        if (!loading && page === 0) {
          setInclusiveEntries([]);
          setSequenceEntries([]);
          setInclusiveTotal(0);
          setSequenceTotal(0);
          setEntries([]);
          setTotalCount(0);
          setCurrentQueryText('');
          setResponseFromCache(false);
          setLastProcessingTimeMs(null);
        }
        return;
      }

      setCurrentQueryText(rhymeVariantsResult.query);
      setResponseFromCache(rhymeVariantsResult.fromCache);
      setLastProcessingTimeMs(rhymeVariantsResult.processingTimeMs);

      const updateVariant = (
        variant: 'inclusive' | 'sequence',
        list: LexiconSearchList | undefined
      ) => {
        const setEntriesFn =
          variant === 'inclusive' ? setInclusiveEntries : setSequenceEntries;
        const setTotalFn =
          variant === 'inclusive' ? setInclusiveTotal : setSequenceTotal;

        if (!list) {
          if (page === 0) {
            setEntriesFn([]);
            setTotalFn(0);
          }
          return;
        }

        setTotalFn(list.count);
        setEntriesFn(prevEntries => {
          const combined =
            page === 0 ? list.items : [...prevEntries, ...list.items];
          return dedupeById(combined);
        });
      };

      updateVariant('inclusive', rhymeVariantsResult.inclusive);
      updateVariant('sequence', rhymeVariantsResult.sequence);

      return;
    }

    if (!readingResult) {
      if (!loading && page === 0) {
        setEntries([]);
        setTotalCount(0);
        setCurrentQueryText('');
        setResponseFromCache(false);
        setLastProcessingTimeMs(null);
      }
      return;
    }

    setTotalCount(readingResult.count);
    setCurrentQueryText(readingResult.query);
    setResponseFromCache(readingResult.fromCache);
    setLastProcessingTimeMs(readingResult.processingTimeMs);

    setEntries(prev => {
      const combined =
        page === 0 ? readingResult.items : [...prev, ...readingResult.items];
      return dedupeById(combined);
    });
  }, [isRhymeSearch, rhymeVariantsResult, readingResult, page, loading]);

  useEffect(() => {
    if (!isRhymeSearch) return;
    const activeEntries = sequenceView ? sequenceEntries : inclusiveEntries;
    const activeTotal = sequenceView ? sequenceTotal : inclusiveTotal;
    setEntries(activeEntries);
    setTotalCount(activeTotal);
  }, [
    isRhymeSearch,
    sequenceView,
    inclusiveEntries,
    sequenceEntries,
    inclusiveTotal,
    sequenceTotal,
  ]);

  const effectiveGroupSize = useMemo(() => {
    if (pageSize > 0) {
      return pageSize;
    }
    if (groupSize > 0) {
      return groupSize;
    }
    return DEFAULT_GROUP_SIZE;
  }, [pageSize, groupSize]);

  useEffect(() => {
    if (entries.length === 0) {
      setGroups([]);
      return;
    }
    const chunkSize = effectiveGroupSize;
    const computedGroups: ReadingItem[][] = [];
    for (let i = 0; i < entries.length; i += chunkSize) {
      computedGroups.push(entries.slice(i, i + chunkSize));
    }
    setGroups(computedGroups);
  }, [entries, effectiveGroupSize]);

  const entriesCount = entries.length;

  useLayoutEffect(() => {
    const el = resultsScrollRef.current;
    if (!el) return;

    const previousSnapshot = scrollSnapshotRef.current;
    const previousHeight = previousSnapshot.height;
    const previousTop = previousSnapshot.top;
    const previousClientHeight = previousSnapshot.clientHeight;

    if (page === 0) {
      el.scrollTop = 0;
      return;
    }

    const nearBottomThreshold = 12;
    const previousDistanceFromBottom =
      previousHeight - previousTop - previousClientHeight;
    const wasNearBottom = previousDistanceFromBottom <= nearBottomThreshold;

    if (wasNearBottom) {
      const maxScrollTop = el.scrollHeight - el.clientHeight;
      el.scrollTop = Math.max(0, maxScrollTop - 1);
      return;
    }

    const heightDelta = el.scrollHeight - previousHeight;
    if (heightDelta !== 0) {
      el.scrollTop = Math.max(0, previousTop + heightDelta);
    }
  }, [entriesCount, page]);

  useLayoutEffect(() => {
    const el = resultsScrollRef.current;
    if (!el) return;
    scrollSnapshotRef.current = {
      top: el.scrollTop,
      height: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
  });

  const hasMore = entriesCount < totalCount;

  const activeItem = entries.find(item => item.id === activeItemId) ?? null;

  const missingQueryKey = useMemo(
    () =>
      kind === 'rhyme'
        ? 'cantoLyr.errors.rhyme.missingQuery'
        : 'cantoLyr.errors.pron.missingQuery',
    [kind]
  );

  const form = useForm({
    defaultValues: { query },
    onSubmit: async () => {
      await search();
    },
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateQueryValue = useCallback(
    (value: string): string | undefined => {
      const result = querySchema.safeParse({ query: value });
      if (!result.success) {
        return result.error.issues[0]?.message ?? missingQueryKey;
      }
      return undefined;
    },
    [missingQueryKey, querySchema]
  );

  useEffect(() => {
    const currentValue = form.getFieldValue('query');
    if (currentValue !== query) {
      form.setFieldValue('query', () => query);
    }
  }, [form, query]);

  const handleActivateItem = useCallback((item: ReadingItem) => {
    setActiveItemId(item.id);
  }, []);

  const handleLoadNextPage = useCallback(() => {
    setPage(page + 1);
  }, [page, setPage]);

  const resolvedError = error
    ? error.startsWith('cantoLyr.')
      ? t(error)
      : error
    : null;

  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="space-y-6">
        <form
          onSubmit={event => {
            event.preventDefault();
            event.stopPropagation();
            setSubmitAttempted(true);
            void form.handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <div className="flex gap-3 items-start">
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
                  const errorMessageKey = field.state.meta.errors[0];

                  return (
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={`lexicon-${kind}-query`}
                          placeholder={t(`cantoLyr.${kind}.placeholder`)}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={event => {
                            const nextValue = event.target.value;
                            field.handleChange(nextValue);
                            setQuery(nextValue);
                          }}
                          className="pl-10"
                          aria-invalid={showFieldError}
                          aria-describedby={
                            showFieldError
                              ? `lexicon-${kind}-query-error`
                              : undefined
                          }
                          inputMode={inputProps?.inputMode}
                          pattern={inputProps?.pattern}
                          autoCapitalize={inputProps?.autoCapitalize}
                          autoCorrect={inputProps?.autoCorrect}
                        />
                      </div>
                      {showFieldError && errorMessageKey && (
                        <p
                          id={`lexicon-${kind}-query-error`}
                          className="mt-2 text-xs text-destructive px-2"
                          role="alert"
                        >
                          {t(errorMessageKey)}
                        </p>
                      )}
                    </div>
                  );
                }}
              </form.Field>
              {isRhymeSearch && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      pressed={sequenceView}
                      onPressedChange={pressed => {
                        setSequenceView(Boolean(pressed));
                        updateOption(
                          'mode',
                          pressed ? 'sequence' : 'inclusive'
                        );
                      }}
                      variant="outline"
                      size="lg"
                      aria-label={t('cantoLyr.lexicon.rhyme.sequenceToggle', {
                        defaultValue: 'Toggle contiguous rhyme matching',
                      })}
                    >
                      {sequenceView
                        ? t('cantoLyr.lexicon.rhyme.sequenceLabel')
                        : t('cantoLyr.lexicon.rhyme.inclusiveLabel')}
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {sequenceView
                        ? t('cantoLyr.lexicon.rhyme.sequenceEnabled', {
                            defaultValue: 'Show only consecutive rhymes',
                          })
                        : t('cantoLyr.lexicon.rhyme.sequenceDisabled', {
                            defaultValue:
                              'Contains all rhymes (regardless of position)',
                          })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
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
            </div>
          </div>
        </form>
        {resolvedError && (
          <p className="text-sm text-destructive" role="alert">
            {resolvedError}
          </p>
        )}
        {(entries.length > 0 || loading || readingResult) && (
          <div className="space-y-4">
            {(totalCount > 0 || loading) && (
              <ResultsHeader
                shown={entries.length}
                total={totalCount}
                cached={responseFromCache}
                queryText={currentQueryText}
                processingTimeMs={lastProcessingTimeMs}
              />
            )}
            {entries.length > 0 ? (
              <div
                ref={resultsScrollRef}
                className="flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1"
                role="region"
                aria-label={t(`cantoLyr.${kind}.resultsRegionLabel`, {
                  ns: 'translation',
                  defaultValue: 'Search results',
                })}
              >
                <GroupedEntrySurface
                  groups={groups}
                  activeId={activeItemId}
                  onActivate={handleActivateItem}
                />
                {hasMore ? (
                  <div className="pt-2">
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={handleLoadNextPage}
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
                  </div>
                ) : (
                  entries.length > 0 &&
                  !loading && (
                    <p className="text-xs text-muted-foreground">
                      {t('cantoLyr.lexicon.messages.endOfResults')}
                    </p>
                  )
                )}
              </div>
            ) : (
              !loading &&
              (isRhymeSearch ? !!rhymeVariantsResult : !!readingResult) && (
                <p className="text-sm text-muted-foreground">
                  {t('cantoLyr.lexicon.messages.noMatches')}
                </p>
              )
            )}
            {entries.length > 0 && <ActiveEntryPanel activeItem={activeItem} />}
          </div>
        )}
        {result && !readingResult && !rhymeVariantsResult && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm">
            <pre className="whitespace-pre-wrap break-words text-muted-foreground/90">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResultsHeaderProps {
  shown: number;
  total: number;
  cached: boolean;
  queryText: string;
  processingTimeMs: number | null;
}

const ResultsHeader = memo(function ResultsHeader({
  shown,
  total,
  cached,
  queryText,
  processingTimeMs,
}: ResultsHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {total > 0 && (
          <span className="font-semibold text-foreground">
            {t('cantoLyr.lexicon.counts.showing', {
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
            {t('cantoLyr.lexicon.badges.cached')}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        {queryText && (
          <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-muted-foreground/90">
            {queryText}
          </span>
        )}
        {typeof processingTimeMs === 'number' && (
          <>
            <span aria-hidden="true">•</span>
            <span>{processingTimeMs.toLocaleString()} ms</span>
          </>
        )}
      </div>
    </div>
  );
});

interface GroupedEntrySurfaceProps {
  groups: ReadingItem[][];
  activeId: string | null;
  onActivate: (item: ReadingItem) => void;
}

const GroupedEntrySurface = memo(function GroupedEntrySurface({
  groups,
  activeId,
  onActivate,
}: GroupedEntrySurfaceProps) {
  const { t } = useTranslation();
  if (!groups.length) return null;
  let runningIndex = 0;
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, idx) => {
        const start = runningIndex + 1;
        const end = runningIndex + group.length;
        runningIndex += group.length;
        return (
          <div key={group[0]?.id ?? idx} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('cantoLyr.lexicon.group.label', {
                  index: idx + 1,
                  defaultValue: `Group ${idx + 1}`,
                })}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {t('cantoLyr.lexicon.group.range', {
                  start,
                  end,
                  defaultValue: `${start}–${end}`,
                })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.map(item => (
                <Button
                  key={item.id}
                  type="button"
                  variant={item.id === activeId ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => onActivate(item)}
                  title={`${item.surface} · ${item.pronunciation}`}
                  className="font-medium"
                >
                  {item.surface}
                </Button>
              ))}
            </div>
            {idx < groups.length - 1 && (
              <div
                className="mt-1 h-px w-full bg-border/60"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

interface ActiveEntryPanelProps {
  activeItem: ReadingItem | null;
}

const ActiveEntryPanel = memo(function ActiveEntryPanel({
  activeItem,
}: ActiveEntryPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="relative rounded-lg border border-border/60 bg-primary/2 p-4 shadow-sm">
      {activeItem ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-foreground">
                {activeItem.surface}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeItem.pronunciation}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="uppercase tracking-wide">
                {formatEntryType(t, activeItem.type)}
              </Badge>
              {activeItem.lang && (
                <LangBadgeWithTooltip
                  idBase={activeItem.id}
                  lang={activeItem.lang}
                />
              )}
            </div>
          </div>
          <LexiconEntryDetails item={activeItem} layout="grid" />
          <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-1">
            <div className="pointer-events-auto flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/95 px-2 py-1 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-muted/70 hover:text-foreground"
                aria-label={t('cantoLyr.lexicon.feedback.up', {
                  defaultValue: 'Mark helpful',
                })}
                onClick={event => {
                  event.stopPropagation();
                  // TODO: Wire feedback action.
                }}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/95 px-2 py-1 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-muted/70 hover:text-foreground"
                aria-label={t('cantoLyr.lexicon.feedback.down', {
                  defaultValue: 'Mark not helpful',
                })}
                onClick={event => {
                  event.stopPropagation();
                  // TODO: Wire feedback action.
                }}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('cantoLyr.lexicon.messages.hoverHint')}
        </p>
      )}
    </div>
  );
});

interface LexiconEntryDetailsProps {
  item: ReadingItem;
  layout?: 'stack' | 'grid';
  className?: string;
}

function LexiconEntryDetails({
  item,
  layout = 'stack',
  className,
}: LexiconEntryDetailsProps) {
  const { t } = useTranslation();
  const detailEntries = useMemo(() => createDetailEntries(t, item), [t, item]);
  const containerClass =
    layout === 'grid' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3';

  return (
    <div className={cn(containerClass, className)}>
      {detailEntries.map(({ label, value, fullWidth }) => (
        <div
          key={label}
          className={cn(
            'space-y-1',
            layout === 'grid' && fullWidth ? 'sm:col-span-2' : undefined
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <p className="break-words text-sm text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

interface LangBadgeWithTooltipProps {
  idBase: string;
  lang: string;
}

function LangBadgeWithTooltip({ idBase, lang }: LangBadgeWithTooltipProps) {
  const { t } = useTranslation();
  const explanation =
    lang === 'zh-HK'
      ? t('cantoLyr.lexicon.langHints.zhHk', {
          defaultValue: 'Colloquial Cantonese (HK)',
        })
      : lang === 'zh-TW'
        ? t('cantoLyr.lexicon.langHints.zhTw', {
            defaultValue: 'Standard written Chinese (TW)',
          })
        : t('cantoLyr.lexicon.langHints.generic', {
            code: lang,
            defaultValue: lang,
          });

  return (
    <button
      type="button"
      onClick={event => event.stopPropagation()}
      className="group relative rounded-md border border-primary/50 bg-muted/60 px-1.5 py-0.5 font-mono text-xs uppercase transition-colors hover:bg-muted"
      aria-describedby={`lang-hint-${idBase}`}
      title={explanation}
    >
      {lang}
      <span
        role="tooltip"
        id={`lang-hint-${idBase}`}
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 max-w-xs -translate-x-1/2 whitespace-normal break-words rounded-md bg-popover min-w-48 px-2 py-4 text-[11px] text-popover-foreground opacity-0 shadow-md ring-1 ring-border/60 transition-opacity group-focus-visible:opacity-100 group-hover:opacity-100"
      >
        {explanation}
      </span>
    </button>
  );
}

export default LexiconSearchBase;
