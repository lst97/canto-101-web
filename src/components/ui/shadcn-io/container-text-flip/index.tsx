import { motion } from 'motion/react';
import React, { useCallback, useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerTextFlipProps {
	/** Array of words to cycle through in the animation */
	words?: string[];
	/** Time in milliseconds between word transitions */
	interval?: number;
	/** Additional CSS classes to apply to the container */
	className?: string;
	/** Additional CSS classes to apply to the text */
	textClassName?: string;
	/** Duration of the transition animation in milliseconds */
	animationDuration?: number;
	/** Optional custom renderer for the current word content (e.g., to add highlights). When provided, defaults letter animation is skipped for full control. */
	renderContent?: (word: string) => React.ReactNode;
	/** Extra horizontal space to add on each side (in px) when sizing the container. */
	widthPadding?: number;
}

export function ContainerTextFlip({
	words = ['better', 'modern', 'beautiful', 'awesome'],
	interval = 3000,
	className,
	textClassName,
	animationDuration = 700,
	renderContent,
	widthPadding = 10,
}: Readonly<ContainerTextFlipProps>) {
	const id = useId();
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [width, setWidth] = useState(widthPadding);
	const textRef = React.useRef<HTMLDivElement>(null);

	const updateWidthForWord = useCallback(() => {
		if (textRef.current) {
			// Measure the single-line width and add padding on each side
			const textWidth =
				Math.ceil(textRef.current.scrollWidth) + widthPadding * 2;
			setWidth(textWidth);
		}
	}, [widthPadding]);

	useEffect(() => {
		// Update width whenever the word changes
		updateWidthForWord();
	}, [currentWordIndex, updateWidthForWord]);

	// Recalculate width on resize of the content (e.g., font load/size change)
	useEffect(() => {
		if (!textRef.current) return;
		const ro = new ResizeObserver(() => updateWidthForWord());
		ro.observe(textRef.current);
		// Initial measure in case
		updateWidthForWord();
		return () => ro.disconnect();
	}, [words, widthPadding, updateWidthForWord]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
			// Width will be updated in the effect that depends on currentWordIndex
		}, interval);

		return () => clearInterval(intervalId);
	}, [words, interval]);

	return (
		<motion.div
			layout
			layoutId={`words-here-${id}`}
			animate={{ width }}
			transition={{ duration: animationDuration / 2000 }}
			className={cn(
				'relative inline-block rounded-lg text-center font-bold text-black md:text-xl dark:text-white mx-1 py-1',
				'[background:linear-gradient(to_bottom,#f3f4f6,#e5e7eb)]',
				'shadow-[inset_0_-1px_#d1d5db,inset_0_0_0_1px_#d1d5db,_0_4px_8px_#d1d5db]',
				'dark:[background:linear-gradient(to_bottom,#374151,#1f2937)]',
				'dark:shadow-[inset_0_-1px_#10171e,inset_0_0_0_1px_hsla(205,89%,46%,.24),_0_4px_8px_#00000052]',
				className,
			)}
			key={words[currentWordIndex]}
		>
			<motion.div
				transition={{
					duration: animationDuration / 1000,
					ease: 'easeInOut',
				}}
				className={cn('inline-block whitespace-nowrap', textClassName)}
				ref={textRef}
				layoutId={`word-div-${words[currentWordIndex]}-${id}`}
			>
				{renderContent ? (
					<motion.div className="inline-block">
						{renderContent(words[currentWordIndex])}
					</motion.div>
				) : (
					<motion.div className="inline-block">
						{words[currentWordIndex].split('').map((letter, index) => (
							<motion.span
								key={`${words[currentWordIndex]}-${index}`}
								initial={{
									opacity: 0,
									filter: 'blur(10px)',
								}}
								animate={{
									opacity: 1,
									filter: 'blur(0px)',
								}}
								transition={{
									delay: index * 0.02,
								}}
							>
								{letter}
							</motion.span>
						))}
					</motion.div>
				)}
			</motion.div>
		</motion.div>
	);
}
