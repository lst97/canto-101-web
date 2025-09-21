import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useLyricSession } from "../../hooks/useLyricGeneration";

export function LyricSession(): ReactElement {
  const { t } = useTranslation();
  const {
    prompt,
    setPrompt,
    toneSequencesInput,
    setToneSequencesInput,
    result,
    error,
    loading,
    generate,
  } = useLyricSession();

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await generate();
  };

  return (
    <div>
      <h2>{t("cantoLyr.lyrics.title")}</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          aria-label={t("cantoLyr.lyrics.promptLabel")}
          placeholder={t("cantoLyr.lyrics.promptPlaceholder")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Input
          aria-label={t("cantoLyr.lyrics.sequencesLabel")}
          placeholder={t("cantoLyr.lyrics.sequencesPlaceholder")}
          value={toneSequencesInput}
          onChange={(e) => setToneSequencesInput(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? (
            <LoadingIndicator
              size="sm"
              label={t("cantoLyr.lyrics.generating")}
              spinnerClassName="text-primary-foreground"
              labelClassName="text-primary-foreground"
            />
          ) : (
            t("cantoLyr.lyrics.generate")
          )}
        </Button>
      </form>
      {error && <p role="alert">{t(error)}</p>}
      {result && <pre>{result}</pre>}
    </div>
  );
}

export default LyricSession;
