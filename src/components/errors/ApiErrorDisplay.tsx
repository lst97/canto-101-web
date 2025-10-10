import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AppError } from '@/types/errors';

interface ApiErrorDisplayProps {
	error: unknown;
	title?: string;
	showTechnicalDetails?: boolean;
}

type CopyStatus = 'idle' | 'success';

export function ApiErrorDisplay({
	error,
	title,
	showTechnicalDetails = true,
}: Readonly<ApiErrorDisplayProps>) {
	const { t } = useTranslation();
	const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

	// Extract error details
	const errorDetails = extractErrorDetails(error);
	const userMessage = errorDetails?.userMessage ?? '';
	const technicalDetails = errorDetails?.technicalDetails;
	const errorCode = errorDetails?.errorCode;
	const shouldClampDetails =
		typeof technicalDetails === 'string' &&
		(technicalDetails.split('\n').length > 10 || technicalDetails.length > 600);

	const handleCopy = useCallback(async () => {
		if (!technicalDetails) {
			return;
		}

		if (
			!('clipboard' in navigator) ||
			typeof navigator.clipboard?.writeText !== 'function'
		) {
			return;
		}

		try {
			await navigator.clipboard.writeText(technicalDetails);
			setCopyStatus('success');
		} catch {
			setCopyStatus('idle');
		}
	}, [technicalDetails]);

	useEffect(() => {
		if (copyStatus !== 'success') {
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			setCopyStatus('idle');
		}, 2000);

		return () => globalThis.clearTimeout(timeoutId);
	}, [copyStatus]);

	if (!errorDetails) {
		return null;
	}

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
						<Accordion
							type="single"
							collapsible
							className="w-full overflow-hidden rounded-lg border border-border/60 bg-muted/20"
						>
							<AccordionItem value="technical">
								<AccordionTrigger className="px-4 py-3 text-sm font-medium">
									{t('errors.technicalDetails', 'Technical Details')}
								</AccordionTrigger>
								<AccordionContent className="px-0 pb-0">
									<div className="border-t border-border/60 bg-muted/10 px-4 pb-4 pt-3">
										<div className="relative mt-3 w-full">
											<ScrollArea
												type="auto"
												className="w-full rounded-lg border border-border/60 bg-background/80 pr-12"
												style={
													shouldClampDetails
														? {
																maxHeight: '15rem',
																height: '15rem',
															}
														: {
																maxHeight: '15rem',
															}
												}
											>
												<pre className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
													<code className="block">{technicalDetails}</code>
												</pre>
											</ScrollArea>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="absolute bottom-2 right-2 shadow-sm"
														aria-label={
															copyStatus === 'success'
																? t(
																		'errors.actions.copiedDebug',
																		'Copied debug information',
																	)
																: t(
																		'errors.actions.copyDebug',
																		'Copy debug information',
																	)
														}
														onClick={handleCopy}
													>
														{copyStatus === 'success' ? (
															<Check className="h-4 w-4" />
														) : (
															<Copy className="h-4 w-4" />
														)}
													</Button>
												</TooltipTrigger>
												<TooltipContent sideOffset={4}>
													{copyStatus === 'success'
														? t(
																'errors.actions.copiedDebug',
																'Copied debug information',
															)
														: t(
																'errors.actions.copyDebug',
																'Copy debug information',
															)}
												</TooltipContent>
											</Tooltip>
										</div>
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
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

function extractErrorDetails(error: unknown): ErrorDetails | null {
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
}: Readonly<ValidationErrorDisplayProps>) {
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
					{errors.map((error) => (
						<li key={error} className="text-sm">
							{error.startsWith('cantoLyr.') ? t(error) : error}
						</li>
					))}
				</ul>
			</AlertDescription>
		</Alert>
	);
}
