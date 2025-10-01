import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { ExternalLink, Volume2 } from 'lucide-react';

import { LexiconPronunciationSearch } from '../components/cantoLyr/lexicon/index.ts';
import QueryErrorBoundary from '../components/errors/QueryErrorBoundary.tsx';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion.tsx';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb.tsx';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.tsx';
import { cn } from '../lib/utils.ts';

export default function CantoLyrPronunciationSearch(): ReactElement {
  const { t } = useTranslation();
  type NumericRowKey =
    | 'tone1'
    | 'tone2'
    | 'tone3'
    | 'tone4'
    | 'tone5'
    | 'tone6';

  const toneRows: Array<{
    toneIndex: string;
    mnemonicDigit: string;
    key: NumericRowKey;
  }> = [
    { toneIndex: '1', mnemonicDigit: '3', key: 'tone1' },
    { toneIndex: '2', mnemonicDigit: '9', key: 'tone2' },
    { toneIndex: '3', mnemonicDigit: '4', key: 'tone3' },
    { toneIndex: '4', mnemonicDigit: '0', key: 'tone4' },
    { toneIndex: '5', mnemonicDigit: '5', key: 'tone5' },
    { toneIndex: '6', mnemonicDigit: '2', key: 'tone6' },
  ];

  const referenceLinks: Array<{ href: string; label: string }> = [
    {
      href: 'https://en.wikipedia.org/wiki/Cantonese_phonology',
      label: t('cantoLyr.pages.pron.numericSourceEnglishLabel'),
    },
    {
      href: 'https://zh.wikipedia.org/wiki/%E7%B2%B5%E8%AA%9E%E8%81%B2%E8%AA%BF',
      label: t('cantoLyr.pages.pron.numericSourceChineseLabel'),
    },
  ];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 pb-24 pt-16 md:px-10 md:pt-20">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/canto-lyr">CantoLyr</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t('cantoLyr.pages.pron.heading')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('cantoLyr.pron.title')}
          </h1>
          <p className="text-muted-foreground max-w-prose">
            {t('cantoLyr.pages.pron.description')}
          </p>
        </header>
      </div>
      <section
        className="space-y-4"
        aria-label={t('cantoLyr.pages.pron.numericHeading')}
      >
        <h2 className="text-xl font-semibold tracking-tight">
          {t('cantoLyr.pages.pron.numericHeading')}
        </h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="tones">
            <AccordionTrigger>
              {t('cantoLyr.pages.pron.numericAccordionTrigger')}
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground max-w-prose">
                {t('cantoLyr.pages.pron.numericIntro')}
              </p>
              <p className="text-muted-foreground max-w-prose">
                {t('cantoLyr.pages.pron.numericDescription')}
              </p>
              <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/40">
                <Table>
                  <TableCaption>
                    {t('cantoLyr.pages.pron.numericTable.caption')}
                  </TableCaption>
                  <TableHeader>
                    <TableRow className="bg-muted/70 text-foreground">
                      <TableHead className="text-foreground">
                        {t(
                          'cantoLyr.pages.pron.numericTable.columns.toneIndex'
                        )}
                      </TableHead>
                      <TableHead className="text-foreground">
                        {t(
                          'cantoLyr.pages.pron.numericTable.columns.mnemonicDigit'
                        )}
                      </TableHead>
                      <TableHead className="text-foreground">
                        {t('cantoLyr.pages.pron.numericTable.columns.toneName')}
                      </TableHead>
                      <TableHead className="text-foreground">
                        {t('cantoLyr.pages.pron.numericTable.columns.example')}
                      </TableHead>
                      <TableHead className="text-foreground w-16">
                        {t('cantoLyr.pages.pron.numericTable.columns.audio')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toneRows.map(
                      ({ toneIndex, mnemonicDigit, key }, index) => (
                        <TableRow
                          key={toneIndex}
                          className={cn(
                            'border-border/60 transition-colors hover:bg-primary/5',
                            index % 2 === 0 ? 'bg-background/80' : 'bg-card/80'
                          )}
                        >
                          <TableCell className="font-semibold text-foreground">
                            {toneIndex}
                          </TableCell>
                          <TableCell className="font-medium text-foreground/90">
                            {mnemonicDigit}
                          </TableCell>
                          <TableCell>
                            {t(
                              `cantoLyr.pages.pron.numericTable.rows.${key}.toneName`
                            )}
                          </TableCell>
                          <TableCell>
                            {t(
                              `cantoLyr.pages.pron.numericTable.rows.${key}.example`
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Volume2 className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('cantoLyr.pages.pron.numericCheckedNote')}
              </p>
              <div className="space-y-3">
                <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('cantoLyr.pages.pron.numericSourcesLabel')}
                  </h3>
                  {referenceLinks.map(({ href, label }) => (
                    <div key={href} className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                      <a
                        className="text-muted-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
                        href={href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      <section aria-label={t('cantoLyr.pron.title')} className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {t('cantoLyr.pages.pron.heading')}
          </h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            {t('cantoLyr.pages.pron.preview')}
          </p>
        </div>
        <QueryErrorBoundary>
          <LexiconPronunciationSearch />
        </QueryErrorBoundary>
      </section>
    </main>
  );
}
