import type { ReactElement } from 'react'
import { Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useTranslation } from 'react-i18next'

export function Root(): ReactElement {
  const { t } = useTranslation()
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-10 md:px-10">{t('common.loading')}</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
