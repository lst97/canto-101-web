import type { KeyboardEvent, ReactElement } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button.tsx';
import { Card, CardContent, CardHeader } from '../ui/card.tsx';
import { Badge } from '../ui/badge.tsx';

const toDomId = (translationKey: string): string => {
  const tail = translationKey.split('.').pop() ?? translationKey;
  return tail.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
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
  const [activeProductKey, setActiveProductKey] = useState<ProductKey>(
    productItems[0].translationKey
  );
  const productTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleProductKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ): void => {
    if (
      ![
        'ArrowRight',
        'ArrowLeft',
        'ArrowDown',
        'ArrowUp',
        'Home',
        'End',
      ].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = productItems.length - 1;
    else {
      const direction =
        event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      nextIndex =
        (index + direction + productItems.length) % productItems.length;
    }
    const nextProduct = productItems[nextIndex];
    setActiveProductKey(nextProduct.translationKey);
    productTabRefs.current[nextIndex]?.focus();
  };

  return (
    <section
      id="products"
      className="mt-24 rounded-[2.5rem] border border-border/80 bg-card/70 px-8 py-12 backdrop-blur-sm md:px-12"
    >
      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-start">
        <div className="space-y-8 lg:max-w-sm">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('homepage.products.title')}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t('homepage.products.description')}
            </p>
          </div>
          <div
            role="tablist"
            aria-label={t('homepage.products.title')}
            aria-orientation="horizontal"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
          >
            {productItems.map((product, index) => {
              const productId = toDomId(product.translationKey);
              const isActive = product.translationKey === activeProductKey;
              return (
                <Button
                  key={product.translationKey}
                  ref={node => {
                    productTabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`${productId}-tab`}
                  aria-selected={isActive}
                  aria-controls={`${productId}-panel`}
                  variant="outline"
                  onClick={() => setActiveProductKey(product.translationKey)}
                  onKeyDown={event => handleProductKeyDown(event, index)}
                  className={[
                    'group relative flex aspect-square w/full min-w-[10rem] flex-col justify-between overflow-hidden rounded-2xl border px-5 py-6 text-left transition-all',
                    isActive
                      ? 'border-primary/60 bg-primary/10 text-foreground shadow-[0_18px_40px_-32px_rgba(0,0,0,0.45)]'
                      : 'border-border/70 bg-background/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
                  ].join(' ')}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                    {t(`${product.translationKey}.label`)}
                  </span>
                  <span className="text-base font-semibold leading-snug text-foreground">
                    {t(`${product.translationKey}.description`)}
                  </span>
                  <span className="absolute inset-x-5 bottom-4 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    {t('homepage.products.items.viewDetails', 'View details')}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex-1">
          {productItems.map(product => {
            const productId = toDomId(product.translationKey);
            const isActive = product.translationKey === activeProductKey;
            return (
              <article
                key={product.translationKey}
                role="tabpanel"
                id={`${productId}-panel`}
                aria-labelledby={`${productId}-tab`}
                hidden={!isActive}
                aria-hidden={!isActive}
                className={isActive ? 'block' : 'hidden'}
              >
                <Card className="h-full rounded-[2.5rem] border border-border/80 bg-background/95 p-10 shadow-[0_32px_80px_-56px_rgba(0,0,0,0.5)] backdrop-blur">
                  <CardHeader className="space-y-5 p-0">
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
                    <ul className="mt-8 grid gap-4 text-base text-foreground sm:grid-cols-2 sm:gap-6">
                      {product.featureKeys.map(featureKey => (
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
                              `${product.translationKey}.features.${featureKey}`
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
