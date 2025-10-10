import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils.ts';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
	({ className, type, disabled, ...props }, forwardedRef) => {
		const innerRef = React.useRef<HTMLInputElement | null>(null);

		const setRefs = React.useCallback(
			(node: HTMLInputElement | null) => {
				innerRef.current = node;

				if (typeof forwardedRef === 'function') {
					forwardedRef(node);
				} else if (forwardedRef) {
					forwardedRef.current = node;
				}
			},
			[forwardedRef],
		);

		const baseClasses = cn(
			'border-input placeholder:text-muted-foreground focus-visible:ring-ring/40 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
			className,
		);

		if (type === 'number') {
			const handleStep = (direction: 'up' | 'down') => {
				const input = innerRef.current;

				if (!input) {
					return;
				}

				if (direction === 'up') {
					input.stepUp();
				} else {
					input.stepDown();
				}

				input.dispatchEvent(new Event('input', { bubbles: true }));
				input.dispatchEvent(new Event('change', { bubbles: true }));
			};

			return (
				<div className="group relative w-full">
					<input
						type="number"
						className={cn(
							baseClasses,
							'pr-11 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
						)}
						ref={setRefs}
						disabled={disabled}
						{...props}
					/>
					<div className="border-input/70 bg-background absolute inset-y-[3px] right-[3px] flex w-6 flex-col overflow-hidden rounded-md border shadow-xs opacity-0 transition-opacity pointer-events-none group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
						<button
							type="button"
							className="hover:bg-muted text-muted-foreground focus-visible:ring-ring/40 flex h-1/2 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2"
							onClick={() => handleStep('up')}
							disabled={disabled}
							aria-label="Increase value"
						>
							<ChevronUp className="h-3 w-3" aria-hidden="true" />
						</button>
						<div className="border-border/60 h-px w-full bg-border" />
						<button
							type="button"
							className="hover:bg-muted text-muted-foreground focus-visible:ring-ring/40 flex h-1/2 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2"
							onClick={() => handleStep('down')}
							disabled={disabled}
							aria-label="Decrease value"
						>
							<ChevronDown className="h-3 w-3" aria-hidden="true" />
						</button>
					</div>
				</div>
			);
		}

		return (
			<input
				type={type}
				className={baseClasses}
				ref={setRefs}
				disabled={disabled}
				{...props}
			/>
		);
	},
);

Input.displayName = 'Input';

export { Input };
