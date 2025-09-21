import type { ReactElement } from "react";
import { Link } from "@tanstack/react-router";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CantoLyrWorkflowCardProps {
  eyebrow?: string;
  title: string;
  description: string;
  to: string;
  cta: string;
}

export function CantoLyrWorkflowCard({ eyebrow, title, description, to, cta }: CantoLyrWorkflowCardProps): ReactElement {
  return (
    <Card className="h-full border-border/60 shadow-none">
      <CardHeader className="space-y-3">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <CardTitle className="text-2xl font-semibold">
          {title}
        </CardTitle>
        <CardDescription className="text-base leading-relaxed text-muted-foreground/90">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Button asChild variant="secondary" className="font-medium">
          <Link to={to} aria-label={title}>
            {cta}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CantoLyrWorkflowCard;
