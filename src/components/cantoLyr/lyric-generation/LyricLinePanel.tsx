import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../ui/badge.tsx';
import { Separator } from '../../ui/separator.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table.tsx';
import type { LyricLineResult } from '../../../lib/schemas/lyric-generation.ts';

interface LyricLinePanelProps {
  line: LyricLineResult;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function LyricLinePanel({ line }: Readonly<LyricLinePanelProps>) {
  const { t } = useTranslation();

  const primarySentence = line.topSentences[0] ?? null;
  const additionalSentences = line.topSentences.slice(1);

  const candidateStats = useMemo(
    () => [
      {
        label: t('cantoLyr.ai.lyrics.lines.candidateStats.total'),
        value: line.candidatePoolStats.total,
      },
      {
        label: t('cantoLyr.ai.lyrics.lines.candidateStats.semantic'),
        value: line.candidatePoolStats.semanticCount,
      },
      {
        label: t('cantoLyr.ai.lyrics.lines.candidateStats.freqTop'),
        value: line.candidatePoolStats.freqTopCount,
      },
      {
        label: t('cantoLyr.ai.lyrics.lines.candidateStats.freqRandom'),
        value: line.candidatePoolStats.freqRandomCount,
      },
    ],
    [line.candidatePoolStats, t]
  );

  const digitBadges = useMemo(() => {
    if (!line.digitSet.length) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {line.digitSet.map(digit => (
          <Badge
            key={`${line.lineIndex}-${digit}`}
            variant="secondary"
            className="font-mono text-xs"
          >
            {digit}
          </Badge>
        ))}
      </div>
    );
  }, [line.digitSet, line.lineIndex]);

  return (
    <div className="space-y-6 text-sm text-foreground">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono">
            {t('cantoLyr.ai.lyrics.lines.toneSequence', {
              tone: line.toneSequence,
            })}
          </span>
          <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono">
            {t('cantoLyr.ai.lyrics.lines.lineIndex', {
              index: line.lineIndex + 1,
            })}
          </span>
        </div>
        {digitBadges && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('cantoLyr.ai.lyrics.lines.digitSet')}
            </span>
            {digitBadges}
          </div>
        )}
        {primarySentence ? (
          <blockquote className="rounded-lg border-l-4 border-primary/70 bg-muted/30 p-3 text-foreground">
            <p className="text-sm leading-relaxed">{primarySentence.text}</p>
            <footer className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted/70 px-2 py-0.5 font-mono">
                {t('cantoLyr.ai.lyrics.lines.primaryPattern', {
                  pattern: primarySentence.patternId,
                })}
              </span>
              <span className="rounded-md bg-muted/70 px-2 py-0.5 font-mono">
                {t('cantoLyr.ai.lyrics.lines.primaryRank', {
                  rank: primarySentence.finalRank.toFixed(2),
                })}
              </span>
              <span className="rounded-md bg-muted/70 px-2 py-0.5 font-mono">
                {t('cantoLyr.ai.lyrics.lines.primaryMmr', {
                  score: primarySentence.mmrScore.toFixed(3),
                })}
              </span>
            </footer>
          </blockquote>
        ) : (
          <p className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {t('cantoLyr.ai.lyrics.lines.noPrimary')}
          </p>
        )}
        {line.error && (
          <p
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive px-2"
            role="alert"
          >
            {t('cantoLyr.ai.lyrics.lines.error', { message: line.error })}
          </p>
        )}
        {line.warnings.length > 0 && (
          <output className="flex flex-wrap items-center gap-2">
            {line.warnings.map((warning, idx) => (
              <Badge
                key={`${line.lineIndex}-warning-${idx}`}
                variant="outline"
                className="text-[11px] uppercase tracking-wide text-amber-600"
              >
                {warning}
              </Badge>
            ))}
          </output>
        )}
      </div>

      <Separator className="bg-border/60" />

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('cantoLyr.ai.lyrics.lines.candidateStats.heading')}
        </h4>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {candidateStats.map(stat => (
            <div
              key={stat.label}
              className="rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-1 text-base font-semibold text-foreground">
                {formatNumber(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('cantoLyr.ai.lyrics.lines.topSentences.heading')}
        </h4>
        {line.topSentences.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('cantoLyr.ai.lyrics.lines.topSentences.columns.text')}
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t('cantoLyr.ai.lyrics.lines.topSentences.columns.pattern')}
                </TableHead>
                <TableHead className="w-24 text-right">
                  {t('cantoLyr.ai.lyrics.lines.topSentences.columns.rank')}
                </TableHead>
                <TableHead className="w-24 text-right">
                  {t('cantoLyr.ai.lyrics.lines.topSentences.columns.mmr')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {line.topSentences.map((sentence, idx) => (
                <TableRow
                  key={`${line.lineIndex}-sentence-${idx}`}
                  className={idx === 0 ? 'bg-muted/40' : undefined}
                >
                  <TableCell className="font-medium">{sentence.text}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                    {sentence.patternId}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {sentence.finalRank.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {sentence.mmrScore.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('cantoLyr.ai.lyrics.lines.topSentences.empty')}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('cantoLyr.ai.lyrics.lines.patterns.heading')}
        </h4>
        {line.patterns.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {line.patterns.map(pattern => (
              <div
                key={pattern.id}
                className="rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {pattern.patternString}
                  </span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {pattern.id}
                  </Badge>
                </div>
                {pattern.groups.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('cantoLyr.ai.lyrics.lines.patterns.groups', {
                      groups: pattern.groups.join(' · '),
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('cantoLyr.ai.lyrics.lines.patterns.empty')}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('cantoLyr.ai.lyrics.lines.allCandidates.heading')}
        </h4>
        {line.allLineCandidates.length > 0 ? (
          <div className="max-h-60 overflow-y-auto rounded-lg border border-border/40 bg-muted/10 p-3">
            <ul className="space-y-2">
              {line.allLineCandidates.map(candidate => (
                <li
                  key={`${line.lineIndex}-${candidate.patternId}-${candidate.text}`}
                  className="space-y-1"
                >
                  <p className="text-sm text-foreground">{candidate.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('cantoLyr.ai.lyrics.lines.allCandidates.pattern', {
                      pattern: candidate.patternId,
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('cantoLyr.ai.lyrics.lines.allCandidates.empty')}
          </p>
        )}
      </section>

      {additionalSentences.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('cantoLyr.ai.lyrics.lines.additional.heading')}
          </h4>
          <ul className="space-y-2">
            {additionalSentences.map((sentence, idx) => (
              <li
                key={`${line.lineIndex}-additional-${idx}`}
                className="rounded-md border border-border/50 bg-muted/20 p-3"
              >
                <p className="text-sm text-foreground">{sentence.text}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono">
                    {sentence.patternId}
                  </span>
                  <span>
                    {t('cantoLyr.ai.lyrics.lines.additional.rank', {
                      rank: sentence.finalRank.toFixed(2),
                    })}
                  </span>
                  <span>
                    {t('cantoLyr.ai.lyrics.lines.additional.mmr', {
                      score: sentence.mmrScore.toFixed(3),
                    })}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {line.topParagraphCandidates.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('cantoLyr.ai.lyrics.lines.paragraphs.heading')}
          </h4>
          <ol className="space-y-2">
            {line.topParagraphCandidates.map((candidate, idx) => (
              <li
                key={`${line.lineIndex}-paragraph-${idx}`}
                className="rounded-md border border-border/50 bg-muted/15 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('cantoLyr.ai.lyrics.lines.paragraphs.label', {
                    index: idx + 1,
                  })}
                </p>
                <p className="text-sm text-foreground">{candidate}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export default LyricLinePanel;
