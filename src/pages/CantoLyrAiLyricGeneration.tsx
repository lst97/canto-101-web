import { Link } from '@tanstack/react-router';
import { ExternalLink, Eye, EyeOff, FlaskConical, Key } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LyricSession } from '../components/cantoLyr/lyric-generation/index.ts';
import QueryErrorBoundary from '../components/errors/QueryErrorBoundary.tsx';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../components/ui/accordion.tsx';
import { Badge } from '../components/ui/badge.tsx';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '../components/ui/breadcrumb.tsx';
import { Button } from '../components/ui/button.tsx';
import { Card, CardContent } from '../components/ui/card.tsx';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../components/ui/dialog.tsx';
import { Input } from '../components/ui/input.tsx';
import { Label } from '../components/ui/label.tsx';
import { Separator } from '../components/ui/separator.tsx';

export default function CantoLyrLyricGeneration(): ReactElement {
	const { t } = useTranslation();
	const [apiKey, setApiKey] = useState('');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [validationError, setValidationError] = useState('');

	const validateApiKey = (key: string): string => {
		if (!key.trim()) {
			return t('cantoLyr.ai.lyrics.form.apiKey.validation.required');
		}
		if (!key.startsWith('AIza')) {
			return t('cantoLyr.ai.lyrics.form.apiKey.validation.invalidFormat');
		}
		if (key.length !== 39) {
			return t('cantoLyr.ai.lyrics.form.apiKey.validation.invalidLength');
		}
		return '';
	};

	return (
		<main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 pb-24 pt-16 md:px-10 md:pt-20">
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
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
									{t('cantoLyr.pages.lyrics.heading')}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="default">
								<Key className="mr-2 h-4 w-4" />
								{t('cantoLyr.ai.lyrics.form.apiKey.button')}{' '}
								{!apiKey && <span className="text-red-500">*</span>}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{t('cantoLyr.ai.lyrics.form.apiKey.dialogTitle')}
								</DialogTitle>
								<DialogDescription>
									{t('cantoLyr.ai.lyrics.form.apiKey.dialogDescriptionPrefix')}
									<a
										href="https://makersuite.google.com/app/apikey"
										target="_blank"
										rel="noopener noreferrer"
										className="underline inline-flex items-center gap-1"
									>
										Google AI Studio
										<ExternalLink className="h-3 w-3" />
									</a>
									{t('cantoLyr.ai.lyrics.form.apiKey.dialogDescriptionMiddle')}
									<br />
									{t('cantoLyr.ai.lyrics.form.apiKey.dialogDescriptionSuffix')}
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="apiKey">
										{t('cantoLyr.ai.lyrics.form.apiKey.label')}
									</Label>
									<div className="relative">
										<Input
											id="apiKey"
											type={showPassword ? 'text' : 'password'}
											value={apiKey}
											onChange={(e) => {
												setApiKey(e.target.value);
												if (validationError) {
													setValidationError(validateApiKey(e.target.value));
												}
											}}
											placeholder={t(
												'cantoLyr.ai.lyrics.form.apiKey.placeholder',
											)}
											className="pr-10"
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() => setShowPassword(!showPassword)}
											aria-label={
												showPassword
													? t('cantoLyr.ai.lyrics.form.apiKey.hidePassword')
													: t('cantoLyr.ai.lyrics.form.apiKey.showPassword')
											}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
									{validationError && (
										<p className="text-sm text-red-500">{validationError}</p>
									)}
								</div>
								<Button
									onClick={() => {
										const error = validateApiKey(apiKey);
										setValidationError(error);
										if (!error) {
											setDialogOpen(false);
										}
									}}
									disabled={!apiKey.trim()}
								></Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
				<header className="space-y-3">
					<p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
						{t('cantoLyr.pages.lyrics.heading')}
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-3xl font-semibold tracking-tight">
							{t('cantoLyr.lyrics.title')}
						</h1>
						<Badge
							variant="secondary"
							className="inline-flex items-center gap-1"
						>
							<FlaskConical className="size-3" />
							<span className="text-[11px] font-semibold uppercase">
								{t('cantoLyr.badges.experimental')}
							</span>
						</Badge>
					</div>
					<p className="text-muted-foreground max-w-prose">
						{t('cantoLyr.pages.lyrics.description')}
					</p>
				</header>
			</div>
			<section aria-label={t('cantoLyr.lyrics.title')} className="space-y-8">
				{/* Informational / limitations card (mirrors style patterns from lexicon AI & pronunciation pages) */}
				<Accordion type="single" collapsible>
					<AccordionItem value="info" className="border rounded-md">
						<AccordionTrigger className="px-4 text-left font-medium">
							{t('cantoLyr.ai.lyrics.page.limitationsHeading')}
						</AccordionTrigger>
						<AccordionContent>
							<Card className="border-0 shadow-none">
								<CardContent className="space-y-6 text-sm pt-0">
									<div>
										<p className="font-medium mb-2">
											{t('cantoLyr.ai.lyrics.page.limitationsHeading')}
										</p>
										<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.limitations.lexiconCoverage',
												)}
											</li>
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.limitations.modelRetrieval',
												)}
											</li>
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.limitations.queryGeneration',
												)}
											</li>
											<li>
												{t('cantoLyr.ai.lyrics.page.limitations.grammarPron')}
											</li>
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.limitations.limitedParagraphs',
												)}
											</li>
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.limitations.slowGeneration',
												)}
											</li>
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.limitations.toneSequenceRange',
												)}
											</li>
										</ul>
									</div>
									<Separator />
									<div>
										<p className="font-medium mb-2">
											{t('cantoLyr.ai.lyrics.page.improveHeading')}
										</p>
										<ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.improvements.lexiconGrowth',
												)}
											</li>
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.improvements.retrievalRerank',
												)}
											</li>
											<li>
												{t(
													'cantoLyr.ai.lyrics.page.improvements.patternScoring',
												)}
											</li>
											<li>
												{t('cantoLyr.ai.lyrics.page.improvements.feedbackLoop')}
											</li>
										</ol>
									</div>
									<Separator />
									<div>
										<p className="font-medium mb-2">
											{t('cantoLyr.ai.lyrics.page.tipsHeading')}
										</p>
										<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
											<li>{t('cantoLyr.ai.lyrics.page.tips.expandLines')}</li>
											<li>
												{t('cantoLyr.ai.lyrics.page.tips.refineSequences')}
											</li>
											<li>
												{t('cantoLyr.ai.lyrics.page.tips.lexiconSemantic')}
											</li>
											<li>{t('cantoLyr.ai.lyrics.page.tips.manualPolish')}</li>
										</ul>
									</div>
									<div className="flex flex-wrap gap-2 pt-2">
										<Badge variant="secondary" className="font-normal">
											{t('cantoLyr.ai.lyrics.page.disclaimer')}
										</Badge>
									</div>
								</CardContent>
							</Card>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
				<QueryErrorBoundary>
					<LyricSession apiKey={apiKey} />
				</QueryErrorBoundary>
			</section>
		</main>
	);
}
