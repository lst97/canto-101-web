import type { ReactElement } from 'react';
import { Link } from '@tanstack/react-router';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';
import { Cpu } from 'lucide-react';

interface CantoLyrWorkflowCardProps {
  eyebrow?: string;
  title: string;
  description: string;
  to: string;
  cta: string;
  showBadge?: boolean;
}

export function CantoLyrWorkflowCard({
  eyebrow,
  title,
  description,
  to,
  cta,
  showBadge = false,
}: CantoLyrWorkflowCardProps): ReactElement {
  return (
    <Card className="relative h-full border-border/60 shadow-none">
      {showBadge ? (
        <div className="absolute right-3 top-3 z-10">
          <Badge variant="outline" className="inline-flex items-center gap-1">
            <Cpu className="size-3" />
            <span className="text-[11px] font-semibold">AI</span>
          </Badge>
        </div>
      ) : null}
      <CardHeader className="space-y-3">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
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
