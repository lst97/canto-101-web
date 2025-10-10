import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge.tsx';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { ContainerTextFlip } from '@/components/ui/shadcn-io/container-text-flip/index.tsx';
import { HighlightText } from '@/components/ui/shadcn-io/highlight-text/index.tsx';
import type { LyricLine, MatchedSyllable } from '@/lib/schemas/lyric.ts';
import { useLyricSearchContext } from './lyricSearchContextCore';
import TokenDetailsPopover from './TokenDetailsPopover';
import {
	findToneDigitRanges,
	graphemesOf,
	isIgnorableChar,
	rangesFromSyllablePositions,
	stripPunctAndSymbols,
} from './text-helpers';

export interface LyricResultCardProps {
	line: LyricLine;
}

export function LyricResultCard({
	line,
}: Readonly<LyricResultCardProps>): ReactElement {
	const { t } = useTranslation();
	const { kind, queryText } = useLyricSearchContext();

	const [highlightedTokenPosition, setHighlightedTokenPosition] = useState<
		number | null
	>(null);
	const [highlightedSyllablePosition, setHighlightedSyllablePosition] =
		useState<number | null>(null);

	const normalizedText = useMemo(
		() => stripPunctAndSymbols(line.text),
		[line.text],
	);
	const hasThemes = Array.isArray(line.themes) && Boolean(line.themes?.length);
	const hasKeywords =
		Array.isArray(line.keywords) && Boolean(line.keywords?.length);
	const matchedSyllables = useMemo(() => {
		if (!Array.isArray(line.matchedSyllables)) {
			return [];
		}
		const filtered = line.matchedSyllables.filter(Boolean) as MatchedSyllable[];
		return filtered.sort((a, b) => a.position - b.position);
	}, [line.matchedSyllables]);
	const showMatchedSyllables =
		kind === 'lyrics-rhyme' && matchedSyllables.length > 0;
	const primaryRhyme = showMatchedSyllables
		? (matchedSyllables[0].rhyme ??
			matchedSyllables[0].jyutpingNormalized ??
			matchedSyllables[0].jyutping)
		: null;
	const artists = Array.isArray(line.song.artists) ? line.song.artists : [];
	const lyricists = Array.isArray(line.song.lyricists)
		? line.song.lyricists
		: [];
	const tokens = useMemo(
		() =>
			Array.isArray(line.tokens)
				? [...line.tokens].sort((a, b) => a.position - b.position)
				: [],
		[line.tokens],
	);
	const syntaxNotes =
		typeof line.syntaxNotes === 'string'
			? line.syntaxNotes.trim() || null
			: null;

	const renderHighlightedText = useCallback(() => {
		// Find all grapheme-based positions of the highlighted token in the normalized text
		const getTokenHighlightRanges = (): Array<{
			start: number;
			end: number;
		}> => {
			if (highlightedTokenPosition === null) return [];

			const highlightedToken = tokens.find(
				(t) => t.position === highlightedTokenPosition,
			);
			if (!highlightedToken?.text) return [];

			const tokenText = highlightedToken.text;
			const textGraphemes = graphemesOf(normalizedText);
			const tokenGraphemes = graphemesOf(tokenText);
			const ranges: Array<{ start: number; end: number }> = [];

			for (let i = 0; i <= textGraphemes.length - tokenGraphemes.length; i++) {
				const candidateSlice = textGraphemes
					.slice(i, i + tokenGraphemes.length)
					.join('');

				if (candidateSlice.toLowerCase() === tokenText.toLowerCase()) {
					ranges.push({ start: i, end: i + tokenGraphemes.length - 1 });
				}
			}

			return ranges;
		};

		const tokenHighlightRanges = getTokenHighlightRanges();

		const renderInlineHighlights = (
			slice: string,
			segStart: number,
			segEnd: number,
		): ReactElement | string | (ReactElement | string)[] => {
			if (highlightedSyllablePosition !== null) {
				const idx0 = highlightedSyllablePosition - 1;
				if (idx0 >= segStart && idx0 < segEnd) {
					const offset = idx0 - segStart;
					const chars = Array.from(slice);
					return chars.map((ch, i) =>
						i === offset ? (
							<HighlightText
								key={`seg-syll-${segStart}-${i}-${ch}`}
								text={ch}
								inViewOnce={false}
								transition={{ duration: 0.5, ease: 'easeOut' }}
								className="inline"
							/>
						) : (
							<span key={`seg-syll-${segStart}-${i}-${ch}-n`}>{ch}</span>
						),
					);
				}
			}

			if (tokenHighlightRanges.length > 0) {
				const graphemes = graphemesOf(slice);
				const result: (ReactElement | string)[] = [];
				let i = 0;

				while (i < graphemes.length) {
					const globalIndex = segStart + i;

					// Find if this position is part of a highlight range
					const matchingRange = tokenHighlightRanges.find(
						(range) => globalIndex >= range.start && globalIndex <= range.end,
					);

					if (matchingRange) {
						// Calculate how much of this range is within the current segment
						const rangeStartInSegment = Math.max(matchingRange.start, segStart);
						const rangeEndInSegment = Math.min(matchingRange.end, segEnd - 1);
						const lengthInSegment = rangeEndInSegment - rangeStartInSegment + 1;

						// Check if the entire token range is within this segment
						// Highlight the portion of the token that lies within this segment
						const tokenText = graphemes.slice(i, i + lengthInSegment).join('');
						result.push(
							<HighlightText
								key={`seg-token-${segStart}-${i}`}
								text={tokenText}
								inViewOnce={false}
								transition={{ duration: 0.5, ease: 'easeOut' }}
								className="inline"
							/>,
						);
						i += lengthInSegment;
					} else {
						result.push(
							<span key={`seg-token-${segStart}-${i}-n`}>{graphemes[i]}</span>,
						);
						i++;
					}
				}

				return result.length > 0 ? result : slice;
			}

			return slice;
		};

		if (kind === 'lyrics-pron') {
			const queryDigits = (queryText || '').replaceAll(/\D+/g, '');
			if (queryDigits.length > 0 && typeof line.tonePatternText === 'string') {
				const text = normalizedText;
				const toneDigits = line.tonePatternText.replaceAll(/\D+/g, '');
				const merged = findToneDigitRanges(text, toneDigits, queryDigits, true);
				if (merged.length > 0) {
					const segments: ReactElement[] = [];
					let cursor = 0;
					for (let i = 0; i < merged.length; i++) {
						const r = merged[i];
						if (r.start > cursor) {
							segments.push(
								<span key={`plain-${i}`}>
									{renderInlineHighlights(
										text.slice(cursor, r.start),
										cursor,
										r.start,
									)}
								</span>,
							);
						}

						const originalText = text.slice(r.start, r.end + 1);
						const renderHighlightedSlice = (slice: string) =>
							renderInlineHighlights(slice, r.start, r.end + 1);

						segments.push(
							<ContainerTextFlip
								key={`tp-${line.id}-${r.start}-${r.end}`}
								words={[originalText]}
								interval={4000}
								animationDuration={500}
								className="rounded border border-primary/20 bg-primary/5"
								renderContent={renderHighlightedSlice}
							/>,
						);
						cursor = r.end + 1;
					}

					if (cursor < text.length) {
						segments.push(
							<span key={`plain-tail`}>
								{renderInlineHighlights(
									text.slice(cursor),
									cursor,
									text.length,
								)}
							</span>,
						);
					}

					return segments;
				}
			}
		}

		if (kind === 'lyrics-rhyme' && matchedSyllables.length > 0) {
			const text = normalizedText;
			const positions = matchedSyllables.map((s) => s.position);
			const merged = rangesFromSyllablePositions(text, positions);
			if (merged.length > 0) {
				const segments: ReactElement[] = [];
				let cursor = 0;
				for (let i = 0; i < merged.length; i++) {
					const r = merged[i];
					if (r.start > cursor) {
						segments.push(
							<span key={`rhy-plain-${i}`}>
								{renderInlineHighlights(
									text.slice(cursor, r.start),
									cursor,
									r.start,
								)}
							</span>,
						);
					}

					const originalText = text.slice(r.start, r.end + 1);
					const renderHighlightedSlice = (slice: string) =>
						renderInlineHighlights(slice, r.start, r.end + 1);

					segments.push(
						<ContainerTextFlip
							key={`rhy-${line.id}-${r.start}-${r.end}`}
							words={[originalText]}
							interval={4000}
							animationDuration={500}
							className="rounded border border-primary/20 bg-primary/5"
							renderContent={renderHighlightedSlice}
						/>,
					);
					cursor = r.end + 1;
				}

				if (cursor < text.length) {
					segments.push(
						<span key={`rhy-plain-tail`}>
							{renderInlineHighlights(text.slice(cursor), cursor, text.length)}
						</span>,
					);
				}

				return segments;
			}
		}

		if (!tokens.length && !matchedSyllables.length) return normalizedText;

		if (highlightedSyllablePosition !== null) {
			const idx = highlightedSyllablePosition - 1;
			const graphemes = Array.from(normalizedText);
			if (idx < 0 || idx >= graphemes.length) return normalizedText;
			return graphemes.map((g, i) =>
				i === idx ? (
					<HighlightText
						key={`highlight-syllable-${highlightedSyllablePosition}-${i}-${g}`}
						text={g}
						inViewOnce={false}
						transition={{ duration: 0.5, ease: 'easeOut' }}
						className="inline"
					/>
				) : (
					g
				),
			);
		}

		if (highlightedTokenPosition !== null) {
			const highlightedToken = tokens.find(
				(token) => token.position === highlightedTokenPosition,
			);
			if (!highlightedToken?.text) return normalizedText;
			const tokenText = highlightedToken.text;
			const parts = normalizedText.split(new RegExp(`(${tokenText})`, 'gi'));
			return parts.map((part, index) =>
				part.toLowerCase() === tokenText.toLowerCase() ? (
					<HighlightText
						key={`highlight-token-${highlightedTokenPosition}-${index}-${part}`}
						text={part}
						inViewOnce={false}
						transition={{ duration: 0.5, ease: 'easeOut' }}
						className="inline"
					/>
				) : (
					part
				),
			);
		}

		return normalizedText;
	}, [
		kind,
		normalizedText,
		line.id,
		line.tonePatternText,
		tokens,
		matchedSyllables,
		highlightedTokenPosition,
		highlightedSyllablePosition,
		queryText,
	]);

	// Pronunciation bigrams section moved inside card to avoid prop drilling
	const bigramSection = useMemo(() => {
		if (kind !== 'lyrics-pron') return null;
		const queryDigits = (queryText || '').replaceAll(/\D+/g, '');
		if (!queryDigits) return null;
		const toneDigits = (line.tonePatternText || '').replaceAll(/\D+/g, '');
		const merged = findToneDigitRanges(
			normalizedText,
			toneDigits,
			queryDigits,
			false,
		);
		if (merged.length === 0) return null;
		const textGraphemes = graphemesOf(normalizedText);
		return (
			<div className="space-y-1">
				<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t('cantoLyr.lyricSearch.labels.bigrams')}
				</span>
				<div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
					{merged.map((r, idx) => {
						const value = textGraphemes
							.slice(r.start, r.end + 1)
							.filter((ch) => !isIgnorableChar(ch))
							.join('');
						const posDisplay = r.start + 1;
						return (
							<span
								key={`${line.id}-tp-${idx}-${r.start}-${r.end}`}
								className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono"
								title={`tones: ${queryDigits}`}
							>
								{posDisplay}. {value}
							</span>
						);
					})}
				</div>
			</div>
		);
	}, [kind, queryText, line.id, line.tonePatternText, normalizedText, t]);

	return (
		<div className="rounded-lg border border-border/60 bg-card/70 p-4 shadow-sm transition-colors hover:border-primary/60">
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
					<div className="space-y-1">
						<div className="text-base font-semibold leading-relaxed text-foreground">
							{renderHighlightedText()}
						</div>
						<div className="text-xs text-muted-foreground">
							<span className="font-semibold uppercase tracking-wide text-muted-foreground/80">
								{t('cantoLyr.lyricSearch.labels.song')}
							</span>
							<Separator
								orientation="vertical"
								className="mx-2 inline-flex h-3"
							/>
							<span>{line.song.title}</span>
							{typeof line.song.year === 'number' && (
								<span className="ml-2 text-muted-foreground/80">
									{line.song.year}
								</span>
							)}
						</div>
						{(artists.length > 0 || lyricists.length > 0) && (
							<p className="text-xs text-muted-foreground/80 flex flex-wrap gap-3">
								{artists.length > 0 && (
									<span>
										{t('cantoLyr.lyricSearch.labels.artists', {
											defaultValue: 'Artists',
										})}
										: {artists.join(', ')}
									</span>
								)}
								{lyricists.length > 0 && (
									<span>
										{t('cantoLyr.lyricSearch.labels.lyricists', {
											defaultValue: 'Lyricists',
										})}
										: {lyricists.join(', ')}
									</span>
								)}
							</p>
						)}
					</div>
					{kind === 'lyrics-rhyme' && primaryRhyme ? (
						<Badge
							variant="outline"
							className="text-xs uppercase tracking-wide"
						>
							{t('cantoLyr.lyricSearch.labels.rhyme', {
								defaultValue: 'Rhyme',
							})}
							: {primaryRhyme}
						</Badge>
					) : (
						<Badge
							variant="secondary"
							className="font-mono text-xs uppercase tracking-wide"
						>
							{line.tonePatternText}
						</Badge>
					)}
				</div>

				<div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
					<div className="space-y-1">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
							{t('cantoLyr.lyricSearch.labels.metadata')}
						</span>
						<div>
							{t('cantoLyr.lyricSearch.labels.lineIndex', {
								index: line.lineIndex + 1,
							})}
							<Separator
								orientation="vertical"
								className="mx-2 inline-flex h-3"
							/>
							{t('cantoLyr.lyricSearch.labels.counts', {
								chars: line.charCount,
								syllables: line.syllableCount,
								tokens: line.tokenCount,
							})}
						</div>
					</div>
					{bigramSection}
				</div>

				{showMatchedSyllables && (
					<div className="space-y-1">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
							{t('cantoLyr.lyricSearch.labels.matchedRhyme', {
								defaultValue: 'Matched Rhyme',
							})}
						</span>
						<div className="flex flex-wrap gap-2 text-xs">
							{matchedSyllables.map((syllable) => {
								const display =
									syllable.rhyme ??
									syllable.jyutpingNormalized ??
									syllable.jyutping;
								return (
									<Badge
										key={`${line.id}-syllable-${syllable.position}`}
										variant="outline"
										className="flex items-center gap-1 cursor-pointer hover:bg-accent"
										onClick={() => {
											setHighlightedSyllablePosition(
												highlightedSyllablePosition === syllable.position
													? null
													: syllable.position,
											);
											setHighlightedTokenPosition(null);
										}}
									>
										<span className="font-mono">#{syllable.position}</span>
										<Separator orientation="vertical" className="h-3" />
										<span className="font-semibold">{display}</span>
										{syllable.consonant && (
											<span className="text-muted-foreground/80">
												{syllable.consonant}
											</span>
										)}
									</Badge>
								);
							})}
						</div>
					</div>
				)}

				{tokens.length > 0 && (
					<div className="space-y-1">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
							{t('cantoLyr.lyricSearch.labels.tokens', {
								defaultValue: 'Tokens',
							})}
						</span>
						<div className="flex flex-wrap gap-2 text-xs">
							{tokens
								.map((token) => ({
									token,
									normalizedTokenText: stripPunctAndSymbols(token.text),
								}))
								.filter(({ normalizedTokenText }) => normalizedTokenText.trim())
								.map(({ token, normalizedTokenText }, displayIndex) => (
									<Popover key={`${line.id}-token-${token.position}`}>
										<PopoverTrigger asChild>
											<button
												type="button"
												className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
												onClick={() => {
													setHighlightedTokenPosition(
														highlightedTokenPosition === token.position
															? null
															: token.position,
													);
													setHighlightedSyllablePosition(null);
												}}
											>
												<span className="font-mono">#{displayIndex + 1}</span>
												<Separator orientation="vertical" className="h-3" />
												<span>{normalizedTokenText}</span>
												{token.pos && (
													<>
														<Separator orientation="vertical" className="h-3" />
														<span className="text-muted-foreground/80">
															{token.pos}
														</span>
													</>
												)}
											</button>
										</PopoverTrigger>
										<PopoverContent className="w-96" align="start">
											<TokenDetailsPopover token={token} />
										</PopoverContent>
									</Popover>
								))}
						</div>
					</div>
				)}

				{syntaxNotes && (
					<div className="space-y-1">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
							{t('cantoLyr.lyricSearch.labels.syntaxNotes', {
								defaultValue: 'Syntax Notes',
							})}
						</span>
						<p className="text-sm text-muted-foreground">{syntaxNotes}</p>
					</div>
				)}

				{(hasThemes || hasKeywords || line.sentiment) && (
					<div className="flex flex-wrap gap-2 text-xs">
						{line.sentiment && (
							<Badge variant="outline" className="uppercase tracking-wide">
								{t('cantoLyr.lyricSearch.labels.sentiment')}: {line.sentiment}
							</Badge>
						)}
						{hasThemes &&
							line.themes?.map((theme) => (
								<Badge
									key={`theme-${theme}`}
									variant="secondary"
									className="text-xs lowercase"
								>
									{theme}
								</Badge>
							))}
						{hasKeywords &&
							line.keywords?.map((keyword) => (
								<Badge
									key={`keyword-${keyword}`}
									variant="outline"
									className="text-xs lowercase"
								>
									{keyword}
								</Badge>
							))}
					</div>
				)}
			</div>
		</div>
	);
}

export default LyricResultCard;
