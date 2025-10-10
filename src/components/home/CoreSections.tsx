import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '../ui/card.tsx';

const toDomId = (translationKey: string): string => {
	const tail = translationKey.split('.').pop() ?? translationKey;
	return tail.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
};

const coreSections = [
	{
		translationKey: 'homepage.programOverview',
		highlightKeys: ['roadmap', 'playlists', 'checkpoints'] as const,
	},
	{
		translationKey: 'homepage.gettingStarted',
		highlightKeys: ['tones', 'dialects', 'romanization'] as const,
	},
	{
		translationKey: 'homepage.resources',
		highlightKeys: ['downloads', 'integrations', 'media'] as const,
	},
	{
		translationKey: 'homepage.community',
		highlightKeys: ['forums', 'events', 'booking'] as const,
	},
] as const;

export default function CoreSections(): ReactElement {
	const { t } = useTranslation();
	return (
		<section className="mt-24 space-y-16">
			{coreSections.map((section) => {
				const sectionId = toDomId(section.translationKey);
				return (
					<article key={section.translationKey} id={sectionId}>
						<Card className="grid gap-12 rounded-[2.5rem] border border-border/80 bg-card/70 px-8 py-12 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.4)] backdrop-blur-sm md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:px-12">
							<CardHeader className="p-0">
								<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
									{t(`${section.translationKey}.title`)}
								</h2>
								<p className="mt-4 text-base text-muted-foreground sm:text-lg">
									{t(`${section.translationKey}.description`)}
								</p>
							</CardHeader>
							<CardContent className="p-0">
								<ul className="space-y-4 text-base sm:text-lg">
									{section.highlightKeys.map((highlightKey) => (
										<li
											key={`${section.translationKey}.highlights.${highlightKey}`}
											className="flex items-start gap-3 rounded-2xl bg-primary/5 px-5 py-4 text-foreground"
										>
											<span
												className="mt-1 inline-flex size-2.5 rounded-full bg-primary"
												aria-hidden
											/>
											<span className="leading-relaxed">
												{t(
													`${section.translationKey}.highlights.${highlightKey}`,
												)}
											</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</article>
				);
			})}
		</section>
	);
}
