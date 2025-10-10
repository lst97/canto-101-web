import { LoaderIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type SpinnerProps = Omit<ComponentProps<'output'>, 'children'> & {
	iconClassName?: string;
	label?: string;
};

function Spinner(props: Readonly<SpinnerProps>) {
	const {
		className,
		iconClassName,
		label = 'Loading',
		'aria-hidden': ariaHidden,
		'aria-live': ariaLive,
		...rest
	} = props;

	const isHidden = ariaHidden === true || ariaHidden === 'true';
	const resolvedAriaLive = isHidden ? undefined : (ariaLive ?? 'polite');

	return (
		<output
			className={cn('inline-flex items-center justify-center', className)}
			aria-hidden={ariaHidden}
			aria-live={resolvedAriaLive}
			{...rest}
		>
			<LoaderIcon
				aria-hidden="true"
				focusable="false"
				className={cn('size-4 animate-spin', iconClassName)}
			/>
			{isHidden ? null : <span className="sr-only">{label}</span>}
		</output>
	);
}

export { Spinner };
