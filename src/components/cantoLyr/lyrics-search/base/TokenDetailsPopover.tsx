import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LyricToken, MatchedSyllable } from '@/lib/schemas/lyric.ts';
import { Volume2 } from 'lucide-react';
import { stripPunctAndSymbols } from './text-helpers';

interface TokenDetailsPopoverProps {
  token: LyricToken;
}

export function TokenDetailsPopover({
  token,
}: Readonly<TokenDetailsPopoverProps>): ReactElement {
  const { t } = useTranslation();

  const syllables = useMemo(
    () =>
      Array.isArray(token.syllables)
        ? (token.syllables.filter(Boolean) as MatchedSyllable[])
        : [],
    [token.syllables]
  );

  const normalizedTokenText = useMemo(() => {
    return stripPunctAndSymbols(token.text);
  }, [token.text]);

  const pronunciation =
    syllables.length > 0
      ? syllables
          .map(
            (s: MatchedSyllable) => s.jyutping || s.jyutpingNormalized || '-'
          )
          .join(' · ')
      : '-';

  const detailEntries = useMemo(() => {
    const entries: Array<{
      label: string;
      value: string;
      groupType?: 'phonetic' | 'other';
    }> = [
      {
        label: t('cantoLyr.lexicon.details.consonants', {
          defaultValue: 'Consonants',
        }),
        value:
          syllables.length > 0
            ? syllables
                .map((s: MatchedSyllable) => s.consonant || '-')
                .join(' · ')
            : '-',
        groupType: 'phonetic',
      },
      {
        label: t('cantoLyr.lexicon.details.rhymes', { defaultValue: 'Rhyme' }),
        value:
          syllables.length > 0
            ? syllables.map((s: MatchedSyllable) => s.rhyme || '-').join(' · ')
            : '-',
        groupType: 'phonetic',
      },
      {
        label: t('cantoLyr.lexicon.details.tone', { defaultValue: 'Tone' }),
        value:
          syllables.length > 0
            ? syllables
                .map((s: MatchedSyllable) =>
                  typeof s.toneDigit === 'number' ? s.toneDigit.toString() : '-'
                )
                .join(' · ')
            : '-',
        groupType: 'phonetic',
      },
      {
        label: t('cantoLyr.lexicon.details.pos', { defaultValue: 'POS' }),
        value: token.pos || '-',
        groupType: 'other',
      },
      {
        label: t('cantoLyr.lyricSearch.labels.position', {
          defaultValue: 'Position',
        }),
        value: token.position.toString(),
        groupType: 'other',
      },
    ];
    return entries.filter(entry => entry.value.trim().length > 0);
  }, [t, token, syllables]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-foreground">
              {normalizedTokenText}
            </h3>
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label={t('common.audio', { defaultValue: 'Play audio' })}
            >
              <Volume2 className="w-5 h-5 text-primary" />
            </button>
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            {pronunciation}
          </p>
        </div>
      </div>

      {detailEntries.length > 0 && (
        <div className="border-t pt-4">
          <div className="space-y-3">
            {(() => {
              const phoneticEntries = detailEntries.filter(
                entry => entry.groupType === 'phonetic'
              );
              const otherEntries = detailEntries.filter(
                entry => entry.groupType === 'other'
              );

              return (
                <>
                  {phoneticEntries.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {phoneticEntries.map(entry => (
                        <div key={entry.label} className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {entry.label}
                          </span>
                          <p className="break-words text-sm text-foreground">
                            {entry.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {otherEntries.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {otherEntries.map(entry => (
                        <div key={entry.label} className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {entry.label}
                          </span>
                          <p className="break-words text-sm text-foreground">
                            {entry.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenDetailsPopover;
