import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "@tanstack/react-router";

import { LyricRhymeSearch } from "@/components/cantoLyr/lyrics-search";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tipKeys = ["families", "placement", "filters"] as const;

export default function CantoLyrLyricRhymeSearch(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleTabChange = (value: string) => {
    if (value === "pron") {
      navigate({ to: "/canto-lyr/lyric-search/pronunciation" });
    } else if (value === "rhyme") {
      navigate({ to: "/canto-lyr/lyric-search/rhyme" });
    }
  };

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
              <BreadcrumbPage>{t("cantoLyr.lyricSearch.nav.rhyme")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("cantoLyr.lyricSearch.rhyme.heading")}
            </h1>
            <p className="text-muted-foreground max-w-prose">
              {t("cantoLyr.lyricSearch.rhyme.description")}
            </p>
          </div>
          <Tabs value="rhyme" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pron">{t("cantoLyr.lyricSearch.nav.pron")}</TabsTrigger>
              <TabsTrigger value="rhyme">{t("cantoLyr.lyricSearch.nav.rhyme")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>
      </div>
      <section aria-label={t("cantoLyr.lyricSearch.rhyme.tipsHeading")} className="space-y-4">
        <Card className="border-border/60 shadow-none">
          <CardContent className="space-y-3 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("cantoLyr.lyricSearch.rhyme.tipsHeading")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("cantoLyr.lyricSearch.rhyme.tipsDescription")}
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tipKeys.map(key => (
                <li key={key}>{t(`cantoLyr.lyricSearch.rhyme.tips.${key}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
      <section aria-label={t("cantoLyr.lyricSearch.rhyme.heading")} className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("cantoLyr.lyricSearch.rhyme.formHeading")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            {t("cantoLyr.lyricSearch.rhyme.formDescription")}
          </p>
        </div>
        <LyricRhymeSearch />
      </section>
    </main>
  );
}
