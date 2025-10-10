import type { ReactElement } from 'react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge.tsx';
import { Card, CardContent, CardHeader } from '../ui/card.tsx';
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '../ui/carousel.tsx';

const toDomId = (translationKey: string): string => {
	const tail = translationKey.split('.').pop() ?? translationKey;
	return tail.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
};

const productItems = [
	{
		translationKey: 'homepage.products.items.cantoLyr',
		featureKeys: [
			'romanization',
			'vocabulary',
			'phrases',
			'grammar',
			'pronunciation',
		] as const,
	},
	{
		translationKey: 'homepage.products.items.cantoCap',
		featureKeys: ['captions', 'annotations', 'export', 'mobile'] as const,
	},
] as const;

type ProductKey = (typeof productItems)[number]['translationKey'];

export default function ProductsShowcase(): ReactElement {
	const { t } = useTranslation();
	const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>(
		undefined,
	);
	const [activeProductKey, setActiveProductKey] = useState<ProductKey>(
		productItems[0].translationKey,
	);

	useEffect(() => {
		if (!carouselApi) {
			return;
		}

		const handleSelect = (): void => {
			const currentIndex = carouselApi.selectedScrollSnap();
			const currentProduct = productItems[currentIndex];
			if (currentProduct) {
				setActiveProductKey(currentProduct.translationKey);
			}
		};

		handleSelect();
		carouselApi.on('select', handleSelect);
		carouselApi.on('reInit', handleSelect);

		return () => {
			carouselApi.off('select', handleSelect);
			carouselApi.off('reInit', handleSelect);
		};
	}, [carouselApi]);

	const productsId = useId();
	return (
		<section
			id={productsId}
			className="mt-24 rounded-[2.5rem] border border-border/80 bg-card/70 px-8 py-12 backdrop-blur-sm md:px-12"
		>
			<div className="flex flex-col gap-10 sm:gap-12">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						{t('homepage.products.title')}
					</h2>
					<p className="text-base text-muted-foreground sm:max-w-xl sm:text-right sm:text-lg">
						{t('homepage.products.description')}
					</p>
				</div>
				<ul
					aria-label={t('homepage.products.title')}
					className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10 mx-auto list-none p-0 m-0"
				>
					{productItems.map((product) => {
						const productId = toDomId(product.translationKey);
						const isActive = product.translationKey === activeProductKey;
						return (
							<li
								key={product.translationKey}
								id={`${productId}-summary`}
								className={[
									'group relative flex aspect-square w-full min-w-[10rem] flex-col justify-between overflow-hidden rounded-2xl border px-5 py-6 text-left transition-all',
									isActive
										? 'border-primary/60 bg-primary/10 text-foreground shadow-[0_18px_40px_-32px_rgba(0,0,0,0.45)]'
										: 'border-border/70 bg-background/70 text-muted-foreground',
								].join(' ')}
							>
								<span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
									{t(`${product.translationKey}.label`)}
								</span>
								<span className="text-base font-semibold leading-snug text-foreground">
									{t(`${product.translationKey}.description`)}
								</span>
								<span className="absolute inset-x-5 bottom-4 text-xs font-medium text-muted-foreground">
									{t('homepage.products.items.viewDetails', 'View details')}
								</span>
							</li>
						);
					})}
				</ul>
				<Carousel
					opts={{ align: 'start' }}
					setApi={setCarouselApi}
					className="relative mx-auto w-full max-w-4xl px-2 sm:px-4"
					aria-labelledby={`${toDomId(activeProductKey)}-summary`}
				>
					<CarouselContent className="pb-6 overflow-visible">
						{productItems.map((product) => (
							<CarouselItem
								key={product.translationKey}
								className="py-4 px-4 sm:px-6 md:px-10"
								aria-labelledby={`${toDomId(product.translationKey)}-summary`}
							>
								<Card className="h-full rounded-[2.5rem] border border-border/80 bg-background/95 p-6 sm:p-8 md:p-10 shadow-[0_8px_40px_-24px_rgba(0,0,0,0.5)] backdrop-blur">
									<CardHeader className="space-y-4 sm:space-y-5 p-0">
										<Badge
											variant="secondary"
											className="w-fit rounded-full border-0 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary"
										>
											{t('homepage.products.title')}
										</Badge>
										<h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
											{t(`${product.translationKey}.label`)}
										</h3>
										<p className="text-base text-muted-foreground sm:text-lg">
											{t(`${product.translationKey}.description`)}
										</p>
									</CardHeader>
									<CardContent className="p-0">
										<ul className="mt-6 grid gap-4 text-base text-foreground sm:grid-cols-2 sm:gap-5">
											{product.featureKeys.map((featureKey) => (
												<li
													key={`${product.translationKey}.features.${featureKey}`}
													className="flex items-start gap-3 rounded-2xl bg-primary/5 px-5 py-4"
												>
													<span
														className="mt-1 inline-flex size-2.5 flex-none rounded-full bg-primary"
														aria-hidden
													/>
													<span className="leading-relaxed text-foreground">
														{t(
															`${product.translationKey}.features.${featureKey}`,
														)}
													</span>
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious className="hidden md:flex" />
					<CarouselNext className="hidden md:flex" />
				</Carousel>
			</div>
		</section>
	);
}
