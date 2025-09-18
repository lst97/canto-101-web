import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export default function CantoLyr(): ReactElement {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <h1 className="text-3xl font-bold">{t('homepage.products.items.cantoLyr.label')}</h1>
      <p className="mt-2 text-muted-foreground">{t('homepage.products.items.cantoLyr.description')}</p>
    </section>
  )
}
