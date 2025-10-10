import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Card, CardContent, CardHeader } from '../ui/card.tsx';

const heroMetricKeys = ['lessons', 'drills', 'community'] as const;

export default function Hero(): ReactElement {
	const { t } = useTranslation();
	return (
		<header id="hero" className="relative">
			<Badge
				variant="outline"
				className="inline-flex items-center gap-2 rounded-full border-primary/30 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary"
			>
				{t('homepage.hero.eyebrow')}
			</Badge>
			<h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
				{t('homepage.hero.title')}
			</h1>
			<p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
				{t('homepage.hero.subtitle')}
			</p>
			<div className="mt-10 flex flex-wrap gap-4">
				<Button size="lg" className="rounded-full px-8 text-base font-semibold">
					{t('homepage.hero.primaryCta')}
				</Button>
				<Button
					size="lg"
					variant="outline"
					className="rounded-full border-2 border-muted text-base font-semibold"
				>
					{t('homepage.hero.secondaryCta')}
				</Button>
			</div>
			<dl className="mt-12 grid gap-6 sm:grid-cols-3">
				{heroMetricKeys.map((key) => (
					<Card
						key={key}
						className="rounded-3xl border border-border/60 bg-card/80 p-6 text-left backdrop-blur-sm"
					>
						<CardHeader className="p-0">
							<div className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
								{t('homepage.hero.eyebrow')}
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="mt-3 text-xl font-semibold text-foreground">
								{t(`homepage.hero.metrics.${key}`)}
							</div>
						</CardContent>
					</Card>
				))}
			</dl>
		</header>
	);
}
