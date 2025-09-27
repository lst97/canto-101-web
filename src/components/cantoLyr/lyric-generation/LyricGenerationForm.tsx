import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';

import { Button } from '../../ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { LoadingIndicator } from '../../ui/loading-indicator.tsx';
import { Textarea } from '../../ui/textarea.tsx';
import type { LyricSessionOptions } from '../../../hooks/useLyricGeneration.ts';

interface LyricGenerationFormProps {
  loading: boolean;
  onSubmit: (options: LyricSessionOptions) => Promise<void>;
  serverError?: string | null;
}

// (Removed legacy resolveErrorMessage helper; validation now returns i18n keys directly.)

function parseToneSequences(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map(segment => segment.trim())
    .filter(Boolean);
}

export function LyricGenerationForm({
  loading,
  onSubmit,
  serverError,
}: LyricGenerationFormProps) {
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      prompt: '',
      toneSequences: '',
      seed: '',
      top: '3',
    },
    onSubmit: async ({ value }) => {
      const sequences = parseToneSequences(value.toneSequences);
      const payload: LyricSessionOptions = {
        prompt: value.prompt.trim(),
        toneSequences: sequences,
      };
      if (value.seed.trim().length > 0) {
        payload.seed = Number(value.seed.trim());
      }
      if (value.top.trim().length > 0) {
        payload.top = Number(value.top.trim());
      }
      await onSubmit(payload);
    },
  });

  // ----- Validation Rules -----
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const PROMPT_MAX = 200; // assumption: reasonable upper bound for creative context

  const validatePrompt = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return 'cantoLyr.errors.lyrics.missingPrompt';
    if (trimmed.length > PROMPT_MAX)
      return 'cantoLyr.errors.lyrics.promptTooLong';
    return undefined;
  }, []);

  const validateSequences = useCallback((value: string): string | undefined => {
    const sequences = parseToneSequences(value);
    if (sequences.length === 0)
      return 'cantoLyr.errors.lyrics.missingSequences';
    if (sequences.length > 3) return 'cantoLyr.errors.lyrics.invalidSequences';
    const lineRegex = /^[023459]{3,}$/; // only digits 0,2,3,4,5,9; at least 3 digits per line
    for (const seq of sequences) {
      if (!lineRegex.test(seq)) {
        return 'cantoLyr.errors.lyrics.invalidSequences';
      }
    }
    return undefined;
  }, []);

  const validateSeed = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined; // optional
    if (!/^[0-9]+$/.test(trimmed)) return 'cantoLyr.errors.lyrics.invalidSeed';
    try {
      const num = Number(trimmed);
      if (!Number.isSafeInteger(num) || num < 0)
        return 'cantoLyr.errors.lyrics.invalidSeed';
    } catch {
      return 'cantoLyr.errors.lyrics.invalidSeed';
    }
    return undefined;
  }, []);

  const validateTop = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined; // allow backend default
    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1 || num > 3)
      return 'cantoLyr.errors.lyrics.invalidTop';
    return undefined;
  }, []);

  const resolvedServerError = useMemo(() => {
    if (!serverError) return null;
    return serverError;
  }, [serverError]);

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <CardTitle>{t('cantoLyr.ai.lyrics.formHeading')}</CardTitle>
        <CardDescription>
          {t('cantoLyr.ai.lyrics.formDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-5"
          noValidate
          onSubmit={event => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="prompt"
            validators={{
              onChange: ({ value }) => validatePrompt(value),
              onSubmit: ({ value }) => validatePrompt(value),
            }}
          >
            {field => {
              const showError =
                field.state.meta.errors.length > 0 &&
                (field.state.meta.isTouched ||
                  field.state.meta.isDirty ||
                  submitAttempted ||
                  form.state.isSubmitting);
              const errKey = field.state.meta.errors[0];
              return (
                <div className="space-y-2">
                  <Label htmlFor="lyric-generation-prompt">
                    {t('cantoLyr.ai.lyrics.form.promptLabel')}
                  </Label>
                  <Textarea
                    id="lyric-generation-prompt"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={event => field.handleChange(event.target.value)}
                    placeholder={t('cantoLyr.ai.lyrics.form.promptPlaceholder')}
                    aria-invalid={showError}
                    aria-describedby={
                      showError ? 'lyric-generation-prompt-error' : undefined
                    }
                  />
                  {showError && errKey && (
                    <p
                      id="lyric-generation-prompt-error"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {t(errKey)}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>
          <form.Field
            name="toneSequences"
            validators={{
              onChange: ({ value }) => validateSequences(value),
              onSubmit: ({ value }) => validateSequences(value),
            }}
          >
            {field => {
              const showError =
                field.state.meta.errors.length > 0 &&
                (field.state.meta.isTouched ||
                  field.state.meta.isDirty ||
                  submitAttempted ||
                  form.state.isSubmitting);
              const errKey = field.state.meta.errors[0];
              return (
                <div className="space-y-2">
                  <Label htmlFor="lyric-generation-tone-sequences">
                    {t('cantoLyr.ai.lyrics.form.sequencesLabel')}
                  </Label>
                  <Textarea
                    id="lyric-generation-tone-sequences"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={event => field.handleChange(event.target.value)}
                    placeholder={t(
                      'cantoLyr.ai.lyrics.form.sequencesPlaceholder'
                    )}
                    aria-invalid={showError}
                    aria-describedby={
                      showError
                        ? 'lyric-generation-tone-sequences-error'
                        : undefined
                    }
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('cantoLyr.ai.lyrics.form.sequencesCaption')}
                  </p>
                  {showError && errKey && (
                    <p
                      id="lyric-generation-tone-sequences-error"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {t(errKey)}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="seed"
              validators={{
                onChange: ({ value }) => validateSeed(value),
                onSubmit: ({ value }) => validateSeed(value),
              }}
            >
              {field => {
                const showError =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched ||
                    field.state.meta.isDirty ||
                    submitAttempted ||
                    form.state.isSubmitting);
                const errKey = field.state.meta.errors[0];
                return (
                  <div className="space-y-2">
                    <Label htmlFor="lyric-generation-seed">
                      {t('cantoLyr.ai.lyrics.form.seedLabel')}
                    </Label>
                    <Input
                      id="lyric-generation-seed"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event =>
                        field.handleChange(
                          event.target.value.replace(/[^0-9]/g, '')
                        )
                      }
                      placeholder={t('cantoLyr.ai.lyrics.form.seedPlaceholder')}
                      inputMode="numeric"
                      aria-invalid={showError}
                      aria-describedby={
                        showError ? 'lyric-generation-seed-error' : undefined
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('cantoLyr.ai.lyrics.form.seedCaption')}
                    </p>
                    {showError && errKey && (
                      <p
                        id="lyric-generation-seed-error"
                        className="text-xs text-destructive"
                        role="alert"
                      >
                        {t(errKey)}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>
            <form.Field
              name="top"
              validators={{
                onChange: ({ value }) => validateTop(value),
                onSubmit: ({ value }) => validateTop(value),
              }}
            >
              {field => {
                const showError =
                  field.state.meta.errors.length > 0 &&
                  (field.state.meta.isTouched ||
                    field.state.meta.isDirty ||
                    submitAttempted ||
                    form.state.isSubmitting);
                const errKey = field.state.meta.errors[0];
                return (
                  <div className="space-y-2">
                    <Label htmlFor="lyric-generation-top">
                      {t('cantoLyr.ai.lyrics.form.topLabel')}
                    </Label>
                    <Input
                      id="lyric-generation-top"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event =>
                        field.handleChange(
                          event.target.value.replace(/[^0-9]/g, '')
                        )
                      }
                      placeholder="3"
                      inputMode="numeric"
                      aria-invalid={showError}
                      aria-describedby={
                        showError ? 'lyric-generation-top-error' : undefined
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('cantoLyr.ai.lyrics.form.topCaption')}
                    </p>
                    {showError && errKey && (
                      <p
                        id="lyric-generation-top-error"
                        className="text-xs text-destructive"
                        role="alert"
                      >
                        {t(errKey)}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="px-6"
              onClick={() => setSubmitAttempted(true)}
            >
              {loading ? (
                <LoadingIndicator
                  size="sm"
                  label={t('cantoLyr.ai.lyrics.form.generating')}
                  spinnerClassName="text-primary-foreground"
                  labelClassName="text-primary-foreground"
                />
              ) : (
                t('cantoLyr.ai.lyrics.form.submit')
              )}
            </Button>
            {loading && (
              <p className="text-xs text-muted-foreground">
                {t('cantoLyr.ai.lyrics.form.generatingHint')}
              </p>
            )}
          </div>
        </form>
        {resolvedServerError && (
          <p role="alert" className="text-sm text-destructive">
            {resolvedServerError.startsWith('cantoLyr.') ||
            resolvedServerError.startsWith('errors.')
              ? t(resolvedServerError)
              : resolvedServerError}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default LyricGenerationForm;
