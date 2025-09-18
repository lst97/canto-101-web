import type { ReactElement } from "react";
import { lazy, Suspense } from "react";

const Hero = lazy(async () => import("@/pages/home/Hero"));
const CoreSections = lazy(async () => import("@/pages/home/CoreSections"));
const ProductsShowcase = lazy(async () =>
  import("@/pages/home/ProductsShowcase")
);
const Cta = lazy(async () => import("@/pages/home/Cta"));

export default function Home(): ReactElement {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex h-[520px] items-center justify-center overflow-hidden">
        <div className="size-[520px] rounded-full bg-primary/10 blur-[140px]" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[12%] -z-10 flex justify-center">
        <div className="h-48 w-2/3 max-w-5xl bg-gradient-to-t from-primary/5 to-transparent blur-3xl" />
      </div>
      <main className="mx-auto flex max-w-6xl flex-col px-6 pb-24 pt-16 md:px-10 md:pt-20">
        <Suspense fallback={<div className="py-8">...</div>}>
          <Hero />
        </Suspense>
        <Suspense fallback={<div className="py-8">...</div>}>
          <CoreSections />
        </Suspense>
        <Suspense fallback={<div className="py-8">...</div>}>
          <ProductsShowcase />
        </Suspense>
        <Suspense fallback={<div className="py-8">...</div>}>
          <Cta />
        </Suspense>
      </main>
    </div>
  );
}
