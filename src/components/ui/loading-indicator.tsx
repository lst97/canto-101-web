import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../lib/utils.ts';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './card.tsx';
import { Ripple } from './shadcn-io/ripple/index.tsx';
import { Spinner } from './spinner.tsx';

const sizeClassMap = {
	sm: 'h-4 w-4',
	md: 'h-5 w-5',
	lg: 'h-6 w-6',
} as const;

interface InlineLoadingIndicatorProps {
	variant?: 'inline';
	label?: string;
	className?: string;
	size?: keyof typeof sizeClassMap;
	visuallyHiddenLabel?: string;
	spinnerClassName?: string;
	labelClassName?: string;
}

interface NavigationLoadingIndicatorProps {
	variant: 'navigation';
	className?: string;
	titleKey?: string;
	descriptionKey?: string;
	labelKey?: string;
	statusKey?: string;
	spinnerClassName?: string;
	spinnerSize?: keyof typeof sizeClassMap;
}

export type LoadingIndicatorProps =
	| InlineLoadingIndicatorProps
	| NavigationLoadingIndicatorProps;

export function LoadingIndicator(
	props: Readonly<LoadingIndicatorProps>,
): ReactElement {
	if (props.variant === 'navigation') {
		return <NavigationLoadingIndicator {...props} />;
	}

	return <InlineLoadingIndicator {...props} />;
}

function InlineLoadingIndicator({
	label,
	className,
	size = 'md',
	visuallyHiddenLabel,
	spinnerClassName,
	labelClassName,
}: Readonly<InlineLoadingIndicatorProps>): ReactElement {
	const ariaLabel = label ?? visuallyHiddenLabel ?? 'Loading';

	return (
		<output
			aria-live="polite"
			aria-label={ariaLabel}
			className={cn('inline-flex items-center gap-2', className)}
		>
			<Spinner
				aria-hidden="true"
				role="presentation"
				className={cn('text-primary', sizeClassMap[size], spinnerClassName)}
			/>
			{label ? <span className={labelClassName}>{label}</span> : null}
		</output>
	);
}

export default LoadingIndicator;

function NavigationLoadingIndicator({
	className,
	titleKey = 'nav.loading.title',
	descriptionKey = 'nav.loading.description',
	labelKey = 'common.loading',
	statusKey = 'nav.loading.status',
	spinnerClassName,
	spinnerSize = 'lg',
}: Readonly<NavigationLoadingIndicatorProps>): ReactElement {
	const { t } = useTranslation();

	return (
		<div
			className={cn(
				'relative isolate flex min-h-[min(32rem,100vh)] w-full items-center justify-center overflow-hidden p-6',
				className,
			)}
			aria-busy="true"
			aria-live="polite"
		>
			<Card className="relative w-full max-w-lg overflow-hidden border-primary/15 bg-card/90 shadow-xl backdrop-blur">
				<Ripple mainCircleOpacity={0.1} numCircles={3} />
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent "
				/>
				<CardHeader className="relative items-center text-center">
					<CardTitle className="text-balance text-lg font-semibold">
						{t(titleKey)}
					</CardTitle>
					<CardDescription className="text-balance text-sm">
						{t(descriptionKey)}
					</CardDescription>
				</CardHeader>
				<CardContent className="relative flex flex-col items-center gap-4 pb-8 pt-2">
					<InlineLoadingIndicator
						visuallyHiddenLabel={t(labelKey)}
						size={spinnerSize}
						spinnerClassName={cn('text-primary', spinnerClassName)}
					/>
					<div className="text-muted-foreground text-xs uppercase tracking-[0.4em]">
						{t(statusKey)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
