import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { AppError } from '@/types/errors';

interface ApiErrorDisplayProps {
  error: AppError | unknown;
  title?: string;
  showTechnicalDetails?: boolean;
}

export function ApiErrorDisplay({
  error,
  title,
  showTechnicalDetails = true,
}: ApiErrorDisplayProps) {
  const { t } = useTranslation();
  const [isTechnicalOpen, setIsTechnicalOpen] = useState(false);

  // Extract error details
  const errorDetails = extractErrorDetails(error);

  if (!errorDetails) {
    return null;
  }

  const { userMessage, technicalDetails, errorCode } = errorDetails;

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title || t('errors.api.title', 'Request Error')}</span>
        {errorCode && (
          <span className="text-xs font-mono bg-destructive/10 px-2 py-1 rounded">
            {errorCode}
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>{userMessage}</p>

          {showTechnicalDetails && technicalDetails && (
            <Collapsible
              open={isTechnicalOpen}
              onOpenChange={setIsTechnicalOpen}
            >
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {isTechnicalOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {t('errors.technicalDetails', 'Technical Details')}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {t('errors.debugInfo', 'Debug Information')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {technicalDetails}
                    </pre>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface ErrorDetails {
  userMessage: string;
  technicalDetails?: string;
  errorCode?: string;
}

function extractErrorDetails(error: AppError | unknown): ErrorDetails | null {
  if (!error) return null;

  // Handle AppError types
  if (typeof error === 'object' && error !== null && 'kind' in error) {
    const appError = error as AppError;

    switch (appError.kind) {
      case 'api':
        return {
          userMessage: appError.message,
          technicalDetails: formatTechnicalDetails(appError),
          errorCode: appError.code || undefined,
        };
      case 'network':
        return {
          userMessage: appError.message,
          technicalDetails: formatTechnicalDetails(appError),
        };
      case 'unexpected':
        return {
          userMessage: appError.message,
          technicalDetails: formatTechnicalDetails(appError),
        };
      default:
        return {
          userMessage: 'An unexpected error occurred',
          technicalDetails: JSON.stringify(error, null, 2),
        };
    }
  }

  // Handle raw error objects (fallback)
  if (error instanceof Error) {
    return {
      userMessage: error.message,
      technicalDetails: error.stack,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      userMessage: error,
    };
  }

  // Handle unknown error types
  return {
    userMessage: 'An unknown error occurred',
    technicalDetails: JSON.stringify(error, null, 2),
  };
}

function formatTechnicalDetails(error: AppError): string {
  const details: Record<string, unknown> = {
    kind: error.kind,
    message: error.message,
  };

  if ('status' in error && error.status) {
    details.status = error.status;
  }

  if ('code' in error && error.code) {
    details.code = error.code;
  }

  if ('details' in error && error.details) {
    details.details = error.details;
  }

  if ('cause' in error && error.cause) {
    details.cause = error.cause;
  }

  return JSON.stringify(details, null, 2);
}

// Helper component for displaying validation errors
interface ValidationErrorDisplayProps {
  errors: string[];
  title?: string;
}

export function ValidationErrorDisplay({
  errors,
  title,
}: ValidationErrorDisplayProps) {
  const { t } = useTranslation();

  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {title || t('errors.validation.title', 'Validation Error')}
      </AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              {error.startsWith('cantoLyr.') ? t(error) : error}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
