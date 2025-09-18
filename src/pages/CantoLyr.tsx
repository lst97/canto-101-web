import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3000";

async function parseResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    return text || response.statusText;
  }
}

export default function CantoLyr(): ReactElement {
  const { t } = useTranslation();

  const [pronQuery, setPronQuery] = useState("");
  const [pronResult, setPronResult] = useState<string | null>(null);
  const [pronError, setPronError] = useState<string | null>(null);
  const [pronLoading, setPronLoading] = useState(false);

  const [rhymeQuery, setRhymeQuery] = useState("");
  const [rhymeResult, setRhymeResult] = useState<string | null>(null);
  const [rhymeError, setRhymeError] = useState<string | null>(null);
  const [rhymeLoading, setRhymeLoading] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [toneSequences, setToneSequences] = useState("");
  const [lyricResult, setLyricResult] = useState<string | null>(null);
  const [lyricError, setLyricError] = useState<string | null>(null);
  const [lyricLoading, setLyricLoading] = useState(false);

  const handlePronSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pronQuery.trim()) {
      setPronError('Please enter a pronunciation query ("p" parameter).');
      return;
    }

    setPronLoading(true);
    setPronError(null);
    setPronResult(null);
    try {
      const params = new URLSearchParams({ p: pronQuery.trim() });
      const response = await fetch(
        `${API_BASE_URL}/lexicon/search/pronunciation?${params.toString()}`,
      );
      const payload = await parseResponsePayload(response);
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload && "error" in payload
            ? String(
              (payload as { error?: { message?: string } }).error?.message ??
                "Request failed",
            )
            : "Pronunciation search failed",
        );
      }
      setPronResult(JSON.stringify(payload, null, 2));
    } catch (error) {
      setPronError(error instanceof Error ? error.message : String(error));
    } finally {
      setPronLoading(false);
    }
  };

  const handleRhymeSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rhymeQuery.trim()) {
      setRhymeError('Please enter a rhyme query ("r" parameter).');
      return;
    }

    setRhymeLoading(true);
    setRhymeError(null);
    setRhymeResult(null);
    try {
      const params = new URLSearchParams({ r: rhymeQuery.trim() });
      const response = await fetch(
        `${API_BASE_URL}/lexicon/search/rhyme?${params.toString()}`,
      );
      const payload = await parseResponsePayload(response);
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload && "error" in payload
            ? String(
              (payload as { error?: { message?: string } }).error?.message ??
                "Request failed",
            )
            : "Rhyme search failed",
        );
      }
      setRhymeResult(JSON.stringify(payload, null, 2));
    } catch (error) {
      setRhymeError(error instanceof Error ? error.message : String(error));
    } finally {
      setRhymeLoading(false);
    }
  };

  const handleLyricGeneration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    const sequences = toneSequences
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (!trimmedPrompt) {
      setLyricError("Prompt is required to generate lyrics.");
      return;
    }
    if (sequences.length === 0) {
      setLyricError("Provide at least one tone sequence (comma separated).");
      return;
    }

    setLyricLoading(true);
    setLyricError(null);
    setLyricResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/lyrics/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          toneSequences: sequences,
        }),
      });
      const payload = await parseResponsePayload(response);
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload && "error" in payload
            ? String(
              (payload as { error?: { message?: string } }).error?.message ??
                "Request failed",
            )
            : "Lyric generation failed",
        );
      }
      setLyricResult(JSON.stringify(payload, null, 2));
    } catch (error) {
      setLyricError(error instanceof Error ? error.message : String(error));
    } finally {
      setLyricLoading(false);
    }
  };

  return (
    <section>
      <h1>{t("homepage.products.items.cantoLyr.label")}</h1>
      <p>{t("homepage.products.items.cantoLyr.description")}</p>

      <div>
        <h2>Pronunciation Search</h2>
        <form onSubmit={handlePronSearch}>
          <input
            aria-label="Pronunciation query"
            placeholder="Enter pronunciation (e.g. ngo5)"
            value={pronQuery}
            onChange={(event) => setPronQuery(event.target.value)}
          />
          <button type="submit" disabled={pronLoading}>
            {pronLoading ? "Searching…" : "Search"}
          </button>
        </form>
        {pronError ? <p role="alert">{pronError}</p> : null}
        {pronResult ? <pre>{pronResult}</pre> : null}
      </div>

      <div>
        <h2>Rhyme Search</h2>
        <form onSubmit={handleRhymeSearch}>
          <input
            aria-label="Rhyme query"
            placeholder="Enter rhyme code (e.g. aa)"
            value={rhymeQuery}
            onChange={(event) => setRhymeQuery(event.target.value)}
          />
          <button type="submit" disabled={rhymeLoading}>
            {rhymeLoading ? "Searching…" : "Search"}
          </button>
        </form>
        {rhymeError ? <p role="alert">{rhymeError}</p> : null}
        {rhymeResult ? <pre>{rhymeResult}</pre> : null}
      </div>

      <div>
        <h2>Lyric Session</h2>
        <form onSubmit={handleLyricGeneration}>
          <input
            aria-label="Lyric prompt"
            placeholder="Describe the scene"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <input
            aria-label="Tone sequences"
            placeholder="Comma separated tone sequences (e.g. 123,456)"
            value={toneSequences}
            onChange={(event) => setToneSequences(event.target.value)}
          />
          <button type="submit" disabled={lyricLoading}>
            {lyricLoading ? "Generating…" : "Generate"}
          </button>
        </form>
        {lyricError ? <p role="alert">{lyricError}</p> : null}
        {lyricResult ? <pre>{lyricResult}</pre> : null}
      </div>
    </section>
  );
}
