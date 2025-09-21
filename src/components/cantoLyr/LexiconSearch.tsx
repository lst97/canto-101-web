import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { useLexiconSearch } from "@/hooks/useLexiconSearch";
import { ENTRY_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface LexiconSearchProps {
  kind: "pron" | "rhyme";
}

export function LexiconSearch({ kind }: LexiconSearchProps): ReactElement {
  const { t } = useTranslation();
  const { query, setQuery, options, updateOption, result, error, loading, search, page, setPage } = useLexiconSearch({ kind });

  const baseOptions = options as { mode?: string; pageSize?: string };
  const mode = baseOptions.mode ?? "all";
  const pageSize = baseOptions.pageSize ?? "25";
  const prefixEnabled = kind === "pron" ? Boolean((options as { prefix?: boolean }).prefix) : false;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await search();
  };

  const handlePrev = (): void => {
    if (page === 0 || loading) return;
    setPage(Math.max(0, page - 1));
  };

  const handleNext = (): void => {
    if (loading) return;
    setPage(page + 1);
  };

  const resolvedError = error ? (error.startsWith("cantoLyr.") ? t(error) : error) : null;

  return (
    <Card className="shadow-none border-border/60">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {t(`cantoLyr.${kind}.title`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor={`lexicon-${kind}-query`}>
              {t(`cantoLyr.${kind}.inputLabel`)}
            </Label>
            <Input
              id={`lexicon-${kind}-query`}
              placeholder={t(`cantoLyr.${kind}.placeholder`)}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {kind === "pron" && (
              <Button
                type="button"
                variant={prefixEnabled ? "default" : "outline"}
                onClick={() => updateOption("prefix", !prefixEnabled)}
                aria-pressed={prefixEnabled}
                className="shrink-0"
              >
                {t("cantoLyr.pron.prefixLabel")}
              </Button>
            )}
            <div className="flex min-w-[180px] flex-col gap-2">
              <Label htmlFor={`lexicon-${kind}-mode`}>
                {t(`cantoLyr.${kind}.modeLabel`)}
              </Label>
              <Select
                value={mode}
                onValueChange={(value) => updateOption("mode", value)}
              >
                <SelectTrigger id={`lexicon-${kind}-mode`} aria-label={t(`cantoLyr.${kind}.modeLabel`)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-[140px] flex-col gap-2">
              <Label htmlFor={`lexicon-${kind}-page-size`}>
                {t(`cantoLyr.${kind}.pageSizeLabel`)}
              </Label>
              <Input
                id={`lexicon-${kind}-page-size`}
                type="number"
                inputMode="numeric"
                min={1}
                value={pageSize}
                onChange={(event) => updateOption("pageSize", event.target.value)}
              />
            </div>
          <div className="ml-auto flex items-end gap-3">
            <Button type="submit" disabled={loading}>
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
          <p className="text-destructive text-sm" role="alert">
            {resolvedError}
          </p>
        )}
        {result && (
          <div className="bg-muted/40 border-border/60 text-sm rounded-lg border p-4">
            <pre className="whitespace-pre-wrap break-words text-muted-foreground/90">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground text-sm">
          {t("cantoLyr.pagination.page", { page: page + 1 })}
        </span>
        <div className="flex w-full justify-end gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            disabled={page === 0 || loading}
            onClick={handlePrev}
            aria-label={t("cantoLyr.pagination.prev")}
          >
            {t("cantoLyr.pagination.prev")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleNext}
            aria-label={t("cantoLyr.pagination.next")}
          >
            {t("cantoLyr.pagination.next")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default LexiconSearch;
