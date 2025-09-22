import {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { useLexiconSearch } from "@/hooks/useLexiconSearch";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { cn } from "@/lib/utils";
import type { ReadingItem, SearchResponse } from "@/lib/schemas/lexicon";

interface LexiconSearchProps {
  kind: "pron" | "rhyme";
}

export function LexiconSearch({ kind }: LexiconSearchProps): ReactElement {
  const { t } = useTranslation();
  const { query, setQuery, result, error, loading, search, page, setPage } = useLexiconSearch({ kind });
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReadingItem[]>([]);
  const [groups, setGroups] = useState<ReadingItem[][]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentQueryText, setCurrentQueryText] = useState<string>("");
  const [responseFromCache, setResponseFromCache] = useState<boolean>(false);
  const [lastProcessingTimeMs, setLastProcessingTimeMs] = useState<number | null>(null);
  const resultsScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollSnapshotRef = useRef<{
    top: number;
    height: number;
    clientHeight: number;
  }>({ top: 0, height: 0, clientHeight: 0 });
  // Pagination now driven by explicit button; load handler defined later (after derived values) for clarity.

  const readingResult = useMemo<SearchResponse | null>(() => {
    if (!result) return null;
    return kind === "pron" || kind === "rhyme" ? (result as SearchResponse) : null;
  }, [result, kind]);

  // Core effect wiring returned API search results into local presentation state
  useEffect(() => {
    if (!readingResult) {
      if (!loading && page === 0) {
        setEntries([]);
        setTotalCount(0);
        setCurrentQueryText("");
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
      if (page === 0) {
        return readingResult.items;
      }

      if (readingResult.items.length === 0) {
        return prev;
      }

      const map = new Map(prev.map(item => [item.id, item]));
      for (const item of readingResult.items) {
        map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, [readingResult, page, loading]);

  // Recompute groups whenever entries or page changes. Each page assumed page size (50) except maybe last.
  useEffect(() => {
    if (entries.length === 0) { setGroups([]); return; }
    const pageSize = 50; // backend contract assumption
    const newGroups: ReadingItem[][] = [];
    for (let i = 0; i < entries.length; i += pageSize) {
      newGroups.push(entries.slice(i, i + pageSize));
    }
    setGroups(newGroups);
  }, [entries]);

  const entriesCount = entries.length;

  // Preserve scroll position across pagination appends by remembering the previous scroll
  // snapshot (scrollTop + container height) and re-applying offsets immediately after render.
  // Smooth scrolling intentionally removed to prevent implicit chaining of loads; user must
  // reach bottom manually for subsequent fetches.
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
    const previousDistanceFromBottom = previousHeight - previousTop - previousClientHeight;
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

  // Capture snapshot after layout
  useLayoutEffect(() => {
    const el = resultsScrollRef.current; if (!el) return;
    scrollSnapshotRef.current = { top: el.scrollTop, height: el.scrollHeight, clientHeight: el.clientHeight };
  });

  const hasMore = entriesCount < totalCount;
  const activeItem = entries.find(e => e.id === activeItemId) ?? null;

  const missingQueryKey = useMemo(() => (
    kind === "rhyme"
      ? "cantoLyr.errors.rhyme.missingQuery"
      : "cantoLyr.errors.pron.missingQuery"
  ), [kind]);

  const querySchema = useMemo(() => (
    z.object({
      query: z
        .string()
        .trim()
        .min(1, { message: missingQueryKey })
        .max(4, { message: "cantoLyr.errors.lexicon.tooLong" })
        .regex(/^[023459]+$/, { message: "cantoLyr.errors.lexicon.invalidDigits" }),
    })
  ), [missingQueryKey]);

  const form = useForm({
    defaultValues: { query },
    onSubmit: async () => {
      await search();
    },
  });

  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);

  const validateQueryValue = useCallback((value: string): string | undefined => {
    const result = querySchema.safeParse({ query: value });
    if (!result.success) {
      return result.error.issues[0]?.message ?? missingQueryKey;
    }
    return undefined;
  }, [missingQueryKey, querySchema]);

  useEffect(() => {
    const currentValue = form.getFieldValue("query");
    if (currentValue !== query) {
      form.setFieldValue("query", () => query);
    }
  }, [form, query]);

  const handleActivateItem = (item: ReadingItem) => { setActiveItemId(item.id); };
  const handleLoadNextPage = () => { setPage(page + 1); };
  const resolvedError = error ? (error.startsWith("cantoLyr.") ? t(error) : error) : null;

  return (
    <Card className="shadow-none border-border/60">
      <CardContent className="space-y-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSubmitAttempted(true);
            void form.handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <div className="flex gap-3">
              <form.Field
                name="query"
                validators={{
                  onChange: ({ value }) => validateQueryValue(value),
                  onSubmit: ({ value }) => validateQueryValue(value),
                }}
                children={(field) => {
                  const showFieldError = (
                    field.state.meta.errors.length > 0
                    && (field.state.meta.isTouched || field.state.meta.isDirty || submitAttempted)
                  );
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
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            field.handleChange(nextValue);
                            setQuery(nextValue);
                          }}
                          className="pl-10"
                          aria-invalid={showFieldError}
                          aria-describedby={showFieldError ? `lexicon-${kind}-query-error` : undefined}
                        />
                      </div>
                      {showFieldError && errorMessageKey && (
                        <p id={`lexicon-${kind}-query-error`} className="text-destructive text-xs mt-2" role="alert">
                          {t(errorMessageKey)}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Button type="submit" disabled={loading} className="px-6">
                {loading ? (
                  <LoadingIndicator
                    size="sm"
                    label={t("common.loading")}
                    spinnerClassName="text-primary-foreground"
                    labelClassName="text-primary-foreground"
                  />
                ) : (
                  t("common.search")
                )}
              </Button>
            </div>
          </div>
        </form>
        {resolvedError && (
          <p className="text-destructive text-sm" role="alert">{resolvedError}</p>
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
                className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1"
                role="region"
                aria-label={t(`cantoLyr.${kind}.resultsRegionLabel`, { ns: "translation", defaultValue: "Search results" })}
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
                          label={t("common.loading")}
                          spinnerClassName="text-primary-foreground"
                          labelClassName="text-primary-foreground"
                        />
                      ) : (
                        t("common.loadMore")
                      )}
                    </Button>
                  </div>
                ) : (
                  entries.length > 0 && !loading && (
                    <p className="text-muted-foreground text-xs">{t("cantoLyr.lexicon.messages.endOfResults")}</p>
                  )
                )}
              </div>
            ) : (
              !loading && !readingResult && (
                <p className="text-muted-foreground text-sm">{t("cantoLyr.lexicon.messages.noMatches")}</p>
              )
            )}
            {entries.length > 0 && (<ActiveEntryPanel activeItem={activeItem} />)}
          </div>
        )}
        {result && !readingResult && (
          <div className="bg-muted/40 border-border/60 text-sm rounded-lg border p-4">
            <pre className="whitespace-pre-wrap break-words text-muted-foreground/90">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type DetailEntry = {
  label: string;
  value: string;
  fullWidth?: boolean;
};

function formatEntryType(t: (k: string, opts?: any) => string, type: ReadingItem["type"]): string {
  return t(`cantoLyr.lexicon.types.${type}`, { defaultValue: type });
}

function formatList(values: string[], separator = ", "): string {
  return values.filter(Boolean).join(separator);
}

function createDetailEntries(t: (k: string, opts?: any) => string, item: ReadingItem): DetailEntry[] {
  const entries: DetailEntry[] = [
    { label: t("cantoLyr.lexicon.details.pronunciation"), value: item.pronunciation },
    { label: t("cantoLyr.lexicon.details.tone"), value: item.tone },
    { label: t("cantoLyr.lexicon.details.jyutping"), value: formatList(item.jyutping, " · ") },
    { label: t("cantoLyr.lexicon.details.consonants"), value: formatList(item.consonants) },
    { label: t("cantoLyr.lexicon.details.rhymes"), value: formatList(item.rhymes) },
    { label: t("cantoLyr.lexicon.details.syllables"), value: item.syllables.toString() },
    { label: t("cantoLyr.lexicon.details.frequency"), value: item.freq.toLocaleString() },
    { label: t("cantoLyr.lexicon.details.pos"), value: item.pos },
    { label: t("cantoLyr.lexicon.details.register"), value: item.register },
    { label: t("cantoLyr.lexicon.details.gloss"), value: item.gloss, fullWidth: true },
    { label: t("cantoLyr.lexicon.details.source"), value: item.source, fullWidth: true },
  ];
  return entries.filter(entry => entry.value.trim().length > 0);
}

interface LexiconEntryDetailsProps {
  item: ReadingItem;
  layout?: "stack" | "grid";
  className?: string;
}

function LexiconEntryDetails({ item, layout = "stack", className }: LexiconEntryDetailsProps) {
  const { t } = useTranslation();
  const detailEntries = useMemo(() => createDetailEntries(t, item), [t, item]);
  const containerClass = layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "space-y-3";

  return (
    <div className={cn(containerClass, className)}>
      {detailEntries.map(({ label, value, fullWidth }) => (
        <div
          key={label}
          className={cn(
            "space-y-1",
            layout === "grid" && fullWidth ? "sm:col-span-2" : undefined,
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <p className="text-sm text-foreground break-words">{value}</p>
        </div>
      ))}
    </div>
  );
}

// Subcomponents & memoized pieces
interface ResultsHeaderProps {
  shown: number; total: number; cached: boolean; queryText: string; processingTimeMs: number | null;
}
const ResultsHeader = memo(function ResultsHeader({ shown, total, cached, queryText, processingTimeMs }: ResultsHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {total > 0 && (
          <span className="text-foreground font-semibold">
            {t("cantoLyr.lexicon.counts.showing", { shown: shown.toLocaleString(), total: total.toLocaleString() })}
          </span>
        )}
        {cached && (
          <Badge variant="outline" className="uppercase tracking-wide text-[11px]">
            {t("cantoLyr.lexicon.badges.cached")}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        {queryText && (
          <span className="font-mono rounded-md bg-muted/60 px-2 py-0.5 text-muted-foreground/90">{queryText}</span>
        )}
        {typeof processingTimeMs === "number" && (
          <>
            <span aria-hidden="true">•</span>
            <span>{processingTimeMs.toLocaleString()} ms</span>
          </>
        )}
      </div>
    </div>
  );
});

interface GroupedEntrySurfaceProps { groups: ReadingItem[][]; activeId: string | null; onActivate: (item: ReadingItem) => void; }
const GroupedEntrySurface = memo(function GroupedEntrySurface({ groups, activeId, onActivate }: GroupedEntrySurfaceProps) {
  const { t } = useTranslation();
  if (!groups.length) return null;
  let runningIndex = 0;
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, idx) => {
        const start = runningIndex + 1; // 1-based for display
        const end = runningIndex + group.length;
        runningIndex += group.length;
        return (
          <div key={group[0]?.id ?? idx} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cantoLyr.lexicon.group.label", { index: idx + 1, defaultValue: `Group ${idx + 1}` })}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {t("cantoLyr.lexicon.group.range", { start, end, defaultValue: `${start}–${end}` })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.map(item => (
                <Button
                  key={item.id}
                  type="button"
                  variant={item.id === activeId ? "secondary" : "outline"}
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
              <div className="h-px w-full bg-border/60 mt-1" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
});

interface ActiveEntryPanelProps { activeItem: ReadingItem | null; }
const ActiveEntryPanel = memo(function ActiveEntryPanel({ activeItem }: ActiveEntryPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="relative rounded-lg border border-border/60 bg-primary/2 p-4 shadow-sm">
      {activeItem ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-foreground">{activeItem.surface}</h3>
              <p className="text-sm text-muted-foreground">{activeItem.pronunciation}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="uppercase tracking-wide">
                {formatEntryType(t, activeItem.type)}
              </Badge>
              {activeItem.lang && (
                <LangBadgeWithTooltip idBase={activeItem.id} lang={activeItem.lang} />
              )}
            </div>
          </div>
          <LexiconEntryDetails item={activeItem} layout="grid" />
          <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-1 items-end">
            <div className="flex gap-2">
              <button
                type="button"
                className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/95 backdrop-blur px-2 py-1 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors shadow-sm"
                aria-label={t('cantoLyr.lexicon.feedback.up', { defaultValue: 'Mark helpful' })}
                onClick={(e) => { e.stopPropagation(); /* TODO: hook feedback */ }}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/95 backdrop-blur px-2 py-1 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors shadow-sm"
                aria-label={t('cantoLyr.lexicon.feedback.down', { defaultValue: 'Mark not helpful' })}
                onClick={(e) => { e.stopPropagation(); /* TODO: hook feedback */ }}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm italic">{t("cantoLyr.lexicon.messages.hoverHint")}</p>
      )}
    </div>
  );
});

interface LangBadgeWithTooltipProps { idBase: string; lang: string }
function LangBadgeWithTooltip({ idBase, lang }: LangBadgeWithTooltipProps) {
  const { t } = useTranslation();
  const explanation = lang === 'zh-HK'
    ? t('cantoLyr.lexicon.langHints.zhHk', { defaultValue: 'Colloquial Cantonese (HK)' })
    : lang === 'zh-TW'
      ? t('cantoLyr.lexicon.langHints.zhTw', { defaultValue: 'Standard written Chinese (TW)' })
      : t('cantoLyr.lexicon.langHints.generic', { code: lang, defaultValue: lang });
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className="relative group font-mono uppercase text-xs px-1.5 py-0.5 border-1 border-primary/50 rounded-md bg-muted/60 hover:bg-muted transition-colors"
      aria-describedby={`lang-hint-${idBase}`}
      title={explanation}
    >
      {lang}
      <span
        role="tooltip"
        id={`lang-hint-${idBase}`}
        className="pointer-events-none absolute z-10 min-w-48 left-1/2 top-full mt-1 -translate-x-1/2 max-w-xs whitespace-normal break-words rounded-md bg-popover px-2 py-4 text-[11px] font-normal text-popover-foreground opacity-0 shadow-md ring-1 ring-border/60 transition-opacity group-focus-visible:opacity-100 group-hover:opacity-100"
      >
        {explanation}
      </span>
    </button>
  );
}

export default LexiconSearch;
