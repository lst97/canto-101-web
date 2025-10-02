import type { ReactElement } from 'react';

import { ApiErrorDisplay } from '@/components/errors/ApiErrorDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AppError } from '@/types/errors';

const sampleApiError: AppError = {
  kind: 'api',
  message: 'Failed to generate lyric suggestions.',
  status: 500,
  code: 'LYRICS_ENGINE_FAILURE',
  retriable: false,
  details: {
    endpoint: '/api/lyrics/generate',
    requestId: 'req_v1_9d2ac7e6',
    payload: {
      prompt: 'Hopeful chorus about new beginnings',
      tonePattern: '394052',
    },
  },
};

const sampleNetworkError: AppError = {
  kind: 'network',
  message:
    'Unable to reach the Canton Lyr service. Please verify your connection.',
  retriable: true,
  cause: {
    host: 'api.cantolyr.dev',
    originalError: 'ERR_NETWORK_DOWN',
  },
};

const sampleUnexpectedError: AppError = {
  kind: 'unexpected',
  message: 'Encountered an unexpected state while parsing the response.',
  cause: {
    message: 'Unexpected token < in JSON at position 0',
  },
};

const errorExamples: Array<{
  heading: string;
  description: string;
  error: AppError;
}> = [
  {
    heading: 'API Error',
    description:
      'Simulates a server-side failure returned from the lyric generation endpoint.',
    error: sampleApiError,
  },
  {
    heading: 'Network Error',
    description:
      'Demonstrates how network interruptions are surfaced to the UI.',
    error: sampleNetworkError,
  },
  {
    heading: 'Unexpected Error',
    description:
      'Shows a defensive fallback for thrown errors that do not fit known categories.',
    error: sampleUnexpectedError,
  },
];

export default function TestApiError(): ReactElement {
  if (import.meta.env.PROD) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>API Error Playground</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is only available during local development.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 pb-8 pt-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          API Error Playground
        </h1>
        <p className="text-sm text-muted-foreground">
          Preview the `ApiErrorDisplay` component with representative `AppError`
          samples. Use this page to verify copy interactions, translations, and
          styling adjustments before wiring live data.
        </p>
      </header>

      {errorExamples.map(({ heading, description, error }) => (
        <section key={heading} className="space-y-3">
          <div>
            <h2 className="text-lg font-medium leading-tight">{heading}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ApiErrorDisplay error={error} />
          <Separator className="mt-4" />
        </section>
      ))}
    </div>
  );
}
