import { useForm } from '@tanstack/react-form';
import {
	memo,
	type ReactElement,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useAiLexiconSearch } from '@/hooks/useAiLexiconSearch.ts';
import type { AiLexiconSearchItem } from '@/lib/schemas/lexicon.ts';

interface DetailEntry {
	label: string;
	value: string;
	fullWidth?: boolean;
}

function formatEntryType(
	translate: (key: string, options?: Record<string, unknown>) => string,
	type: AiLexiconSearchItem['type'],
): string {
	return translate(`cantoLyr.lexicon.types.${type}`, { defaultValue: type });
}

function formatList(values: string[], separator = ' · '): string {
	return values.filter(Boolean).join(separator);
}

function buildDetailEntries(
	translate: (key: string) => string,
	item: AiLexiconSearchItem,
): DetailEntry[] {
	const entries: DetailEntry[] = [
		{
			label: translate('cantoLyr.lexicon.details.jyutping'),
			value: formatList(item.jyutping),
		},
		{ label: translate('cantoLyr.lexicon.details.tone'), value: item.tone },
		{
			label: translate('cantoLyr.lexicon.details.consonants'),
			value: formatList(item.consonants),
		},
		{
			label: translate('cantoLyr.lexicon.details.rhymes'),
			value: formatList(item.rhymes),
		},
	];

	if (typeof item.syllables === 'number') {
		entries.push({
			label: translate('cantoLyr.lexicon.details.syllables'),
			value: item.syllables.toLocaleString(),
		});
	}
	if (typeof item.freq === 'number') {
		entries.push({
			label: translate('cantoLyr.lexicon.details.frequency'),
			value: item.freq.toLocaleString(),
		});
	}
	if (item.pos) {
		entries.push({
			label: translate('cantoLyr.lexicon.details.pos'),
			value: item.pos,
		});
	}
	if (item.register) {
		entries.push({
			label: translate('cantoLyr.lexicon.details.register'),
			value: item.register,
		});
	}
	if (item.gloss) {
		entries.push({
			label: translate('cantoLyr.lexicon.details.gloss'),
			value: item.gloss,
			fullWidth: true,
		});
	}
	if (item.source) {
		entries.push({
			label: translate('cantoLyr.lexicon.details.source'),
			value: item.source,
			fullWidth: true,
		});
	}

	return entries.filter((entry) => entry.value.trim().length > 0);
}

export function LexiconAiSearch(): ReactElement {
	const { t } = useTranslation();
	const {
		query,
		setQuery,
		pronunciation,
		setPronunciation,
		limit,
		setLimit,
		result,
		loading,
		error,
		search,
	} = useAiLexiconSearch();
	const [activeId, setActiveId] = useState<string | null>(null);

	const queryId = useId();
	const queryErrorId = useId();
	const pronunciationId = useId();
	const pronunciationErrorId = useId();
	const limitId = useId();
	const limitErrorId = useId();

	// Zod schema mirroring pronunciation constraints from LexiconPronunciationSearch.tsx
	const pronunciationSchema = z
		.string()
		.trim()
		.max(4, { message: 'cantoLyr.errors.lexicon.tooLong' })
		.regex(/^[023459]*$/, { message: 'cantoLyr.errors.lexicon.invalidDigits' });

	// Non-empty query required (mirrors existing schema in lexicon.ts)
	const querySchema = z
		.string()
		.trim()
		.min(1, { message: 'cantoLyr.errors.lexicon.missingQuery' })
		.max(64, { message: 'cantoLyr.errors.lexicon.tooLong' });

	// Keep limit as a string in form state to avoid type churn on first submit.
	const formSchema = z.object({
		query: querySchema,
		pronunciation: pronunciationSchema.min(1, {
			message: 'cantoLyr.errors.lexicon.missingPronunciation',
		}),
		limit: z
			.string()
			.trim()
			.regex(/^\d+$/, { message: 'cantoLyr.errors.lexicon.invalidDigits' })
			.refine(
				(v) => {
					const n = Number.parseInt(v, 10);
					return n >= 1 && n <= 25;
				},
				{ message: 'cantoLyr.errors.lexicon.limitRange' },
			),
	});

	const form = useForm({
		defaultValues: {
			query: query ?? '',
			pronunciation: pronunciation ?? '',
			limit: limit ?? '10',
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			// Update local state for continuity (e.g., other components reading these stores),
			// but rely on override parameters to avoid race conditions.
			setQuery(value.query);
			setPronunciation(value.pronunciation);
			setLimit(value.limit);
			await search({
				q: value.query,
				pronunciation: value.pronunciation,
				limit: value.limit,
			});
		},
	});

	const resolvedError = useMemo(() => {
		if (!error) return null;
		return error.startsWith('cantoLyr.') || error.startsWith('errors.')
			? t(error)
			: error;
	}, [error, t]);

	const items = result?.items ?? [];
	const hasItems = items.length > 0;
	const activeItem = items.find((item) => item.id === activeId) ?? null;

	useEffect(() => {
		setActiveId(null);
	}, []);

	const handleActivate = useCallback((identifier: string) => {
		setActiveId((prev) => (prev === identifier ? prev : identifier));
	}, []);
	const summary = result
		? t('cantoLyr.lexicon.counts.showing', {
				shown: items.length.toLocaleString(),
				total: result.count.toLocaleString(),
			})
		: null;

	return (
		<Card className="border-border/60 shadow-none">
			<CardContent className="space-y-6">
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					noValidate
				>
					{/* Query Field */}
					<form.Field name="query">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={queryId}>
									{t('cantoLyr.ai.lexicon.form.queryLabel')}
								</Label>
								<Input
									id={queryId}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={t('cantoLyr.ai.lexicon.form.queryPlaceholder')}
									autoComplete="off"
									aria-invalid={field.state.meta.errors.length > 0}
									aria-describedby={
										field.state.meta.errors.length ? queryErrorId : undefined
									}
								/>
								{field.state.meta.errors[0] &&
									(field.state.meta.isTouched || form.state.isSubmitting) && (
										<p
											id={queryErrorId}
											className="text-xs text-destructive px-2"
										>
											{(() => {
												const err = field.state.meta.errors[0] as
													| string
													| { message?: string };
												const msg: string | undefined =
													typeof err === 'string' ? err : err?.message;
												if (!msg) return null;
												return msg.startsWith('cantoLyr.') ||
													msg.startsWith('errors.')
													? t(msg)
													: msg;
											})()}
										</p>
									)}
							</div>
						)}
					</form.Field>
					<div className="flex flex-col gap-4 sm:flex-row">
						{/* Pronunciation Field */}
						<form.Field name="pronunciation">
							{(field) => (
								<div className="flex-1 space-y-2">
									<Label htmlFor={pronunciationId}>
										{t('cantoLyr.ai.lexicon.form.pronunciationLabel')}
									</Label>
									<Input
										id={pronunciationId}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={t(
											'cantoLyr.ai.lexicon.form.pronunciationPlaceholder',
										)}
										inputMode="numeric"
										pattern="[023459]*"
										autoComplete="off"
										aria-invalid={field.state.meta.errors.length > 0}
										aria-describedby={
											field.state.meta.errors.length
												? pronunciationErrorId
												: undefined
										}
									/>
									{field.state.meta.errors[0] &&
										(field.state.meta.isTouched || form.state.isSubmitting) && (
											<p
												id={pronunciationErrorId}
												className="text-xs text-destructive px-2"
											>
												{(() => {
													const err = field.state.meta.errors[0] as
														| string
														| { message?: string };
													const msg: string | undefined =
														typeof err === 'string' ? err : err?.message;
													if (!msg) return null;
													return msg.startsWith('cantoLyr.') ||
														msg.startsWith('errors.')
														? t(msg)
														: msg;
												})()}
											</p>
										)}
								</div>
							)}
						</form.Field>
						{/* Limit Field */}
						<form.Field name="limit">
							{(field) => (
								<div className="sm:w-36 space-y-2">
									<Label htmlFor={limitId}>
										{t('cantoLyr.ai.lexicon.form.limitLabel')}
									</Label>
									<Input
										id={limitId}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value.replaceAll(/\D/g, ''))
										}
										placeholder="10"
										inputMode="numeric"
										pattern="[0-9]*"
										autoComplete="off"
										aria-invalid={field.state.meta.errors.length > 0}
										aria-describedby={
											field.state.meta.errors.length ? limitErrorId : undefined
										}
									/>
									{field.state.meta.errors[0] &&
										(field.state.meta.isTouched || form.state.isSubmitting) && (
											<p
												id={limitErrorId}
												className="text-xs text-destructive px-2"
											>
												{(() => {
													const err = field.state.meta.errors[0] as
														| string
														| { message?: string };
													const msg: string | undefined =
														typeof err === 'string' ? err : err?.message;
													if (!msg) return null;
													return msg.startsWith('cantoLyr.') ||
														msg.startsWith('errors.')
														? t(msg)
														: msg;
												})()}
											</p>
										)}
									<p className="text-xs text-muted-foreground">
										{t('cantoLyr.ai.lexicon.form.limitCaption')}
									</p>
								</div>
							)}
						</form.Field>
					</div>
					<div className="flex items-center gap-3">
						<Button type="submit" disabled={loading} className="px-6">
							{loading ? (
								<LoadingIndicator
									size="sm"
									label={t('common.loading')}
									spinnerClassName="text-primary-foreground"
									labelClassName="text-primary-foreground"
								/>
							) : (
								t('common.search')
							)}
						</Button>
					</div>
				</form>
				{resolvedError && (
					<p className="text-sm text-destructive" role="alert">
						{resolvedError}
					</p>
				)}
				{result && (
					<section className="space-y-4" aria-live="polite">
						<div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
							<div className="flex flex-wrap items-center gap-2">
								{summary && (
									<span className="font-semibold text-foreground">
										{summary}
									</span>
								)}
								{result.fromCache && (
									<Badge
										variant="outline"
										className="text-[11px] uppercase tracking-wide"
									>
										{t('cantoLyr.lexicon.badges.cached')}
									</Badge>
								)}
							</div>
							<div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
								<span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-muted-foreground/90">
									{t('cantoLyr.ai.lexicon.summary.query', {
										query: result.query,
									})}
								</span>
								<span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-muted-foreground/90">
									{t('cantoLyr.ai.lexicon.summary.pronunciation', {
										pronunciation: result.pronunciation,
									})}
								</span>
								{typeof result.processingTimeMs === 'number' && (
									<span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-muted-foreground/90">
										{t('cantoLyr.ai.lexicon.summary.timing', {
											ms: result.processingTimeMs.toLocaleString(),
										})}
									</span>
								)}
							</div>
						</div>
						{hasItems ? (
							<div className="space-y-4">
								<ul
									className="flex flex-wrap gap-2"
									aria-label={t('cantoLyr.ai.lexicon.title')}
								>
									{items.map((item) => (
										<li key={item.id}>
											<Button
												type="button"
												variant={item.id === activeId ? 'secondary' : 'outline'}
												size="sm"
												className="font-medium"
												title={`${item.surface} · ${item.pronunciation}`}
												onClick={() => handleActivate(item.id)}
											>
												{item.surface}
											</Button>
										</li>
									))}
								</ul>
								<AiLexiconActivePanel item={activeItem} />
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								{t('cantoLyr.ai.lexicon.noResults')}
							</p>
						)}
					</section>
				)}
			</CardContent>
		</Card>
	);
}

interface AiLexiconActivePanelProps {
	item: AiLexiconSearchItem | null;
}

const AiLexiconActivePanel = memo(function AiLexiconActivePanel({
	item,
}: AiLexiconActivePanelProps) {
	const { t } = useTranslation();

	if (!item) {
		return (
			<div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
				{t('cantoLyr.lexicon.messages.hoverHint')}
			</div>
		);
	}

	const similarityPercentage = Math.round(item.similarity * 100);
	const details = buildDetailEntries(t, item);

	return (
		<div className="space-y-4 rounded-lg border border-border/60 bg-primary/2 p-4 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1">
					<h3 className="text-lg font-semibold leading-tight text-foreground">
						{item.surface}
					</h3>
					<p className="text-sm text-muted-foreground">{item.pronunciation}</p>
				</div>
				<div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
					<Badge variant="outline" className="uppercase tracking-wide">
						{formatEntryType(t, item.type)}
					</Badge>
					<Badge variant="secondary" className="uppercase tracking-wide">
						{t('cantoLyr.ai.lexicon.similarityBadge', {
							percentage: similarityPercentage,
						})}
					</Badge>
				</div>
			</div>
			<dl className="grid gap-3 sm:grid-cols-2">
				{details.map((detail) => (
					<div
						key={`${item.id}-${detail.label}`}
						className={detail.fullWidth ? 'sm:col-span-2' : undefined}
					>
						<dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							{detail.label}
						</dt>
						<dd className="text-sm text-foreground">{detail.value}</dd>
					</div>
				))}
			</dl>
		</div>
	);
});

export default LexiconAiSearch;
