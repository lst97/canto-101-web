import type { ReactElement } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';
import type { LucideIcon } from 'lucide-react';
import { Cpu, FlaskConical } from 'lucide-react';

type CantoLyrWorkflowBadgeVariant = 'ai' | 'experimental';

interface CantoLyrWorkflowCardProps {
  eyebrow?: string;
  title: string;
  description: string;
  to: string;
  cta: string;
  badgeVariant?: CantoLyrWorkflowBadgeVariant;
  secondBadgeVariant?: CantoLyrWorkflowBadgeVariant;
}

export function CantoLyrWorkflowCard({
  eyebrow,
  title,
  description,
  to,
  cta,
  badgeVariant,
  secondBadgeVariant,
}: CantoLyrWorkflowCardProps): ReactElement {
  const { t } = useTranslation();

  type BadgeConfig = {
    Icon: LucideIcon;
    variant: 'secondary' | 'outline';
    label: string;
  };

  const isExperimentalBadge = badgeVariant === 'experimental';
  const isAiBadge = badgeVariant === 'ai';

  let badgeConfig: BadgeConfig | undefined;

  if (isExperimentalBadge) {
    badgeConfig = {
      Icon: FlaskConical,
      variant: 'secondary',
      label: t('cantoLyr.badges.experimental'),
    };
  } else if (isAiBadge) {
    badgeConfig = {
      Icon: Cpu,
      variant: 'outline',
      label: t('cantoLyr.badges.ai'),
    };
  }

  const secondBadgeConfig =
    secondBadgeVariant === 'experimental'
      ? {
          Icon: FlaskConical,
          variant: 'secondary' as const,
        }
      : undefined;

  return (
    <Card className="relative h-full border-border/60 shadow-none">
      {badgeConfig || secondBadgeConfig ? (
        <div className="absolute right-3 top-3 z-10 flex gap-1">
          {badgeConfig ? (
            <Badge
              variant={badgeConfig.variant}
              className="inline-flex items-center gap-1"
            >
              <badgeConfig.Icon className="size-3" />
              <span className="text-[11px] font-semibold">
                {badgeConfig.label}
              </span>
            </Badge>
          ) : null}
          {secondBadgeConfig ? (
            <Badge
              variant={secondBadgeConfig.variant}
              className="inline-flex items-center gap-1"
            >
              <secondBadgeConfig.Icon className="size-3" />
            </Badge>
          ) : null}
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
export type { CantoLyrWorkflowBadgeVariant };
