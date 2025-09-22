import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { LexiconRhymeSearch } from "@/components/cantoLyr/lexicon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cantonesePinyinTable } from "@/data/cantonesePinyinTable";

const jyutpingDetailKeys = [
  "structure",
  "onset",
  "tones",
  "rhymeLink",
] as const;

function chunkArray<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0) return [Array.from(array)];
  const result: T[][] = [];
  for (let index = 0; index < array.length; index += size) {
    result.push(array.slice(index, index + size));
  }
  return result;
}

export default function CantoLyrRhymeSearch(): ReactElement {
  const { t } = useTranslation();
  const consonants = cantonesePinyinTable.consonants;
  const rhymeRows = chunkArray(cantonesePinyinTable.rhymes, 6).map(group => ({
    start: group[0] ?? "",
    end: group[group.length - 1] ?? "",
    finals: group,
  }));
  const referenceLinks: Array<{ href: string; label: string }> = [
    {
      href: "https://en.wikipedia.org/wiki/Jyutping#Chart",
      label: t("cantoLyr.pages.pron.rhymeSourceJyutping"),
    },
    {
      href: "https://en.wikipedia.org/wiki/Cantonese_phonology#Finals",
      label: t("cantoLyr.pages.pron.rhymeSourceRime"),
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
              <BreadcrumbPage>{t("cantoLyr.pages.rhyme.heading")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("cantoLyr.rhyme.title")}
          </h1>
          <p className="text-muted-foreground max-w-prose">
            {t("cantoLyr.pages.rhyme.description")}
          </p>
        </header>
      </div>
      <section className="space-y-4" aria-label={t("cantoLyr.pages.pron.jyutpingHeading")}>
        <Accordion type="single" collapsible>
          <AccordionItem value="jyutping">
            <AccordionTrigger>
              {t("cantoLyr.pages.pron.jyutpingHeading")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground max-w-prose">
                {t("cantoLyr.pages.pron.jyutpingIntro")}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {jyutpingDetailKeys.map(detailKey => (
                  <li key={detailKey}>{t(`cantoLyr.pages.pron.jyutpingDetails.${detailKey}`)}</li>
                ))}
              </ul>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("cantoLyr.pages.pron.jyutpingConsonantsLabel")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("cantoLyr.pages.pron.jyutpingConsonantsDescription")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {consonants.map(initial => (
                    <Badge key={initial} variant="outline" className="font-mono text-sm uppercase">
                      {initial}
                    </Badge>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="rhyme">
            <AccordionTrigger>
              {t("cantoLyr.pages.pron.rhymeHeading")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground max-w-prose">
                {t("cantoLyr.pages.pron.rhymeDescription")}
              </p>
              <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/40">
                <Table>
                  <TableCaption>{t("cantoLyr.pages.pron.rhymeTable.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow className="bg-muted/70 text-foreground">
                      <TableHead className="w-32 text-foreground">
                        {t("cantoLyr.pages.pron.rhymeTable.columns.range")}
                      </TableHead>
                      <TableHead className="text-foreground">
                        {t("cantoLyr.pages.pron.rhymeTable.columns.finals")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rhymeRows.map(({ start, end, finals }) => {
                      const rangeLabel = start && end && start !== end ? `${start} - ${end}` : start ?? "";
                      return (
                        <TableRow key={`${start}-${end}`} className="border-border/60">
                          <TableCell className="font-medium text-foreground/90">
                            {rangeLabel}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {finals.map(final => (
                                <Badge key={final} variant="secondary" className="font-mono text-sm lowercase">
                                  {final}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("cantoLyr.pages.pron.rhymeListNote")}
              </p>
              <div className="space-y-3">
                <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("cantoLyr.pages.pron.rhymeSourcesLabel")}
                  </h3>
                  {referenceLinks.map(({ href, label }) => (
                    <div key={href} className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/70" />
                      <a
                        className="text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-primary"
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
      <section aria-label={t("cantoLyr.rhyme.title")} className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("cantoLyr.pages.rhyme.heading")}
          </h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            {t("cantoLyr.pages.rhyme.preview")}
          </p>
        </div>
        <LexiconRhymeSearch />
      </section>
    </main>
  );
}
