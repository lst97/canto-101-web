import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export default function CantoCap(): ReactElement {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <h1 className="text-3xl font-bold">{t('homepage.products.items.cantoCap.label')}</h1>
      <p className="mt-2 text-muted-foreground">{t('homepage.products.items.cantoCap.description')}</p>
    </section>
  )
}
