import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { LyricSession } from "@/components/cantoLyr/lyric-generation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CantoLyrLyricGeneration(): ReactElement {
  const { t } = useTranslation();

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
              <BreadcrumbPage>{t("cantoLyr.pages.lyrics.heading")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t("cantoLyr.pages.lyrics.heading")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("cantoLyr.lyrics.title")}
          </h1>
          <p className="text-muted-foreground max-w-prose">
            {t("cantoLyr.pages.lyrics.description")}
          </p>
        </header>
      </div>
      <section aria-label={t("cantoLyr.lyrics.title")} className="space-y-8">
        {/* Informational / limitations card (mirrors style patterns from lexicon AI & pronunciation pages) */}
        <Accordion type="single" collapsible>
          <AccordionItem value="info" className="border rounded-md">
            <AccordionTrigger className="px-4 text-left font-medium">
              {t("cantoLyr.ai.lyrics.page.shortOverview", { defaultValue: "限制與提示" })}
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="space-y-6 text-sm pt-0">
                  <div>
                    <p className="font-medium mb-2">{t("cantoLyr.ai.lyrics.page.limitationsHeading")}</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>{t("cantoLyr.ai.lyrics.page.limitations.lexiconCoverage")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.limitations.modelRetrieval")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.limitations.queryGeneration")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.limitations.grammarPron")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.limitations.limitedParagraphs")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.limitations.slowGeneration")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.limitations.toneSequenceRange")}</li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium mb-2">{t("cantoLyr.ai.lyrics.page.improveHeading")}</p>
                    <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                      <li>{t("cantoLyr.ai.lyrics.page.improvements.lexiconGrowth")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.improvements.retrievalRerank")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.improvements.patternScoring")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.improvements.feedbackLoop")}</li>
                    </ol>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium mb-2">{t("cantoLyr.ai.lyrics.page.tipsHeading")}</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>{t("cantoLyr.ai.lyrics.page.tips.expandLines")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.tips.refineSequences")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.tips.lexiconSemantic")}</li>
                      <li>{t("cantoLyr.ai.lyrics.page.tips.manualPolish")}</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="font-normal">
                      {t("cantoLyr.ai.lyrics.page.disclaimer")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <LyricSession />
      </section>
    </main>
  );
}
