import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

interface TopParagraphListProps {
  paragraphs: string[];
}

export function TopParagraphList({ paragraphs }: TopParagraphListProps) {
  const { t } = useTranslation();

  if (!paragraphs.length) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          {t("cantoLyr.ai.lyrics.topParagraphs.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((text, idx) => (
        <article key={`paragraph-${idx}`} className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="uppercase tracking-wide">
              {t("cantoLyr.ai.lyrics.topParagraphs.badge", { index: idx + 1 })}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{text}</p>
        </article>
      ))}
    </div>
  );
}

export default TopParagraphList;
