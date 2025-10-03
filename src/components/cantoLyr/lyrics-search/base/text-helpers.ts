// Text and range helpers for lyric search components
export const IGNORABLE_RE = /[\s\p{P}\p{S}]/u; // spaces + punctuation + symbols
export const PUNCT_OR_SYMBOL_RE = /[\p{P}\p{S}]/gu; // punctuation + symbols (keeps spaces)

export function stripSpacesPunctAndSymbols(s: string): string {
  return s.replace(/[\s\p{P}\p{S}]/gu, '');
}

export function stripPunctAndSymbols(s: string): string {
  return s.replace(PUNCT_OR_SYMBOL_RE, '');
}

export function isIgnorableChar(ch: string): boolean {
  return IGNORABLE_RE.test(ch);
}

export function graphemesOf(s: string): string[] {
  return Array.from(s);
}

export function buildNonIgnorableIndexMap(graphemes: string[]): number[] {
  const map: number[] = [];
  for (let i = 0; i < graphemes.length; i++) {
    if (!isIgnorableChar(graphemes[i])) map.push(i);
  }
  return map;
}

export function mergeRanges(
  ranges: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  if (ranges.length <= 1) {
    return ranges.slice().sort((a, b) => a.start - b.start);
  }
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const r of sorted) {
    const last = merged.at(-1);
    if (!last || r.start > last.end) {
      merged.push({ ...r });
    } else {
      last.end = Math.max(last.end, r.end);
    }
  }
  return merged;
}

export function findToneDigitRanges(
  normalizedText: string,
  toneDigits: string,
  queryDigits: string,
  includeTrailingIgnorables: boolean
): Array<{ start: number; end: number }> {
  if (!queryDigits || !toneDigits) return [];
  const graphemes = graphemesOf(normalizedText);
  const nonIgnorable = buildNonIgnorableIndexMap(graphemes);
  const ranges: Array<{ start: number; end: number }> = [];
  for (let i = 0; i + queryDigits.length <= toneDigits.length; i++) {
    if (toneDigits.slice(i, i + queryDigits.length) === queryDigits) {
      const startIdx = nonIgnorable[i];
      let endIdx = nonIgnorable[i + queryDigits.length - 1];
      if (includeTrailingIgnorables) {
        while (
          typeof endIdx === 'number' &&
          endIdx + 1 < graphemes.length &&
          isIgnorableChar(graphemes[endIdx + 1])
        ) {
          endIdx += 1;
        }
      }
      if (
        typeof startIdx === 'number' &&
        typeof endIdx === 'number' &&
        startIdx <= endIdx
      ) {
        ranges.push({ start: startIdx, end: endIdx });
      }
    }
  }
  return mergeRanges(ranges);
}

export function rangesFromSyllablePositions(
  normalizedText: string,
  positions: number[]
): Array<{ start: number; end: number }> {
  const graphemes = graphemesOf(normalizedText);
  const nonIgnorable = buildNonIgnorableIndexMap(graphemes);
  const ranges: Array<{ start: number; end: number }> = [];
  for (const pos of positions) {
    const idx0 = pos - 1;
    const startIdx = nonIgnorable[idx0];
    if (
      typeof startIdx === 'number' &&
      startIdx >= 0 &&
      startIdx < graphemes.length
    ) {
      let endIdx = startIdx;
      while (
        endIdx + 1 < graphemes.length &&
        isIgnorableChar(graphemes[endIdx + 1])
      ) {
        endIdx += 1;
      }
      ranges.push({ start: startIdx, end: endIdx });
    }
  }
  return mergeRanges(ranges);
}
