import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/utils.ts';

const sizeClassMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

export interface LoadingIndicatorProps {
  label?: string;
  className?: string;
  size?: keyof typeof sizeClassMap;
  visuallyHiddenLabel?: string;
  spinnerClassName?: string;
  labelClassName?: string;
}

export function LoadingIndicator({
  label,
  className,
  size = 'md',
  visuallyHiddenLabel,
  spinnerClassName,
  labelClassName,
}: LoadingIndicatorProps): ReactElement {
  const ariaLabel = label ?? visuallyHiddenLabel ?? 'Loading';

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <Loader2
        aria-hidden="true"
        className={cn(
          'animate-spin text-primary',
          sizeClassMap[size],
          spinnerClassName
        )}
      />
      {label ? <span className={labelClassName}>{label}</span> : null}
    </span>
  );
}

export default LoadingIndicator;
