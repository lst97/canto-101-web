import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../ui/badge.tsx';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion.tsx';
import type { LyricLineResult } from '../../../lib/schemas/lyric-generation.ts';

import { LyricLinePanel } from './LyricLinePanel.tsx';

interface LyricLinesAccordionProps {
  lines: LyricLineResult[];
}

export function LyricLinesAccordion({
  lines,
}: Readonly<LyricLinesAccordionProps>) {
  const { t } = useTranslation();
  const accordionItems = useMemo(
    () =>
      lines.map(line => {
        const snippet =
          line.topSentences[0]?.text ??
          t('cantoLyr.ai.lyrics.lines.previewFallback');
        return {
          key: `line-${line.lineIndex}`,
          label: t('cantoLyr.ai.lyrics.lines.title', {
            index: line.lineIndex + 1,
            tone: line.toneSequence,
          }),
          snippet,
          line,
        };
      }),
    [lines, t]
  );

  if (accordionItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('cantoLyr.ai.lyrics.lines.empty')}
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-3">
      {accordionItems.map(item => (
        <AccordionItem key={item.key} value={item.key}>
          <AccordionTrigger>
            <div className="flex w-full flex-col gap-1 text-left">
              <span className="text-sm font-semibold text-foreground">
                {item.label}
              </span>
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {item.snippet}
              </span>
            </div>
            {item.line.warnings.length > 0 && (
              <Badge
                variant="outline"
                className="ml-3 text-[11px] uppercase tracking-wide"
              >
                {t('cantoLyr.ai.lyrics.lines.warningsCount', {
                  count: item.line.warnings.length,
                })}
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <LyricLinePanel line={item.line} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default LyricLinesAccordion;
