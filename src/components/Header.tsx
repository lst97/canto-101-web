import type { ReactElement } from 'react';
import { Activity, useCallback, useEffect, useRef, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu.tsx';
import { Separator } from './ui/separator.tsx';
import ModeToggle from './mode-toggle.tsx';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet.tsx';
import { Button } from './ui/button.tsx';
import { ChevronDown, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.tsx';
import { Link, useRouterState } from '@tanstack/react-router';

export function Header(): ReactElement {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>('');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const productsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const productsScrollPositionRef = useRef<number>(0);
  const pathname = useRouterState({ select: s => s.location.pathname });
  const isOnCantoLyr = pathname.startsWith('/canto-lyr');
  const isOnCantoCap = pathname.startsWith('/canto-cap');
  const isOnProducts = isOnCantoLyr || isOnCantoCap;

  const smoothScrollToId = useCallback((id: string): void => {
    if (
      typeof globalThis.window === 'undefined' ||
      typeof document === 'undefined'
    ) {
      return;
    }
    const element = document.getElementById(id);
    if (!element) return;
    const prefersReducedMotion = globalThis.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    if ('scrollIntoView' in element) {
      element.scrollIntoView({ behavior, block: 'start' });
    } else {
      const targetY =
        globalThis.scrollY +
        (element as HTMLElement).getBoundingClientRect().top;
      globalThis.scrollTo({ top: targetY, behavior });
    }
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string): void => {
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const id = href.slice(1);
      if (
        typeof globalThis.window !== 'undefined' &&
        typeof globalThis.requestAnimationFrame === 'function'
      ) {
        globalThis.requestAnimationFrame(() => {
          smoothScrollToId(id);
        });
      } else {
        smoothScrollToId(id);
      }
      // Update hash without causing an instant jump
      if (typeof globalThis.window !== 'undefined') {
        globalThis.history.replaceState(null, '', href);
      }
    },
    [smoothScrollToId]
  );

  const handleProductsMenuOpenChange = useCallback(
    (nextOpen: boolean): void => {
      if (typeof globalThis.window === 'undefined') return;
      if (nextOpen) {
        productsScrollPositionRef.current = globalThis.scrollY;
        return;
      }

      const previousScrollTop = productsScrollPositionRef.current;
      const restoreScroll = (): void => {
        globalThis.scrollTo({ top: previousScrollTop });
      };

      if (typeof globalThis.requestAnimationFrame === 'function') {
        globalThis.requestAnimationFrame(restoreScroll);
      } else {
        restoreScroll();
      }
    },
    []
  );

  const links: Array<{ href: string; key: string }> = [
    { href: '#program-overview', key: 'programOverview' },
    { href: '#getting-started', key: 'gettingStarted' },
    { href: '#resources', key: 'resources' },
    { href: '#community', key: 'community' },
    { href: '#products', key: 'products' },
  ];

  useEffect(() => {
    const ids = [
      'program-overview',
      'getting-started',
      'resources',
      'community',
      'products',
    ];
    const elements = ids
      .map(id => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        // Find the most visible section
        const mostVisible = entries
          .filter(e => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0)
          )[0];
        if (mostVisible?.target?.id) {
          setActiveId(mostVisible.target.id);
        }
      },
      {
        // Trigger when ~60% of the section is visible
        threshold: [0.6],
        rootMargin: '0px 0px -20% 0px',
      }
    );

    for (const el of elements) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Measure header height on mount and on resize to update a CSS variable used for offsetting content
  useEffect(() => {
    if (typeof globalThis.window === 'undefined') return;
    const root = document.documentElement;
    const measure = () => {
      const headerEl = document.querySelector('header[data-app-header]');
      const h = headerEl ? (headerEl as HTMLElement).offsetHeight : 72;
      root.style.setProperty('--app-header-height', `${h}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const headerEl = document.querySelector('header[data-app-header]');
    if (headerEl) ro.observe(headerEl);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  return (
    <header
      data-app-header
      className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:px-10">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            to="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className="font-black tracking-tight text-foreground text-lg sm:text-xl"
          >
            {t('nav.title')}
          </Link>
          <div className="hidden lg:block">
            <Separator
              orientation="vertical"
              className="mx-3 inline-block h-6"
            />
          </div>
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              {links
                .filter(l => l.key !== 'products')
                .map(l => (
                  <NavigationMenuItem key={l.key}>
                    <NavigationMenuLink asChild>
                      <a
                        href={l.href}
                        onClick={e => handleNavClick(e, l.href)}
                        aria-current={
                          activeId && l.href === `#${activeId}`
                            ? 'page'
                            : undefined
                        }
                        className={[
                          'px-2 py-1 text-sm font-medium transition-colors',
                          activeId && l.href === `#${activeId}`
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        {t(`nav.links.${l.key}`)}
                      </a>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              <NavigationMenuItem>
                <DropdownMenu onOpenChange={handleProductsMenuOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <button
                      ref={productsTriggerRef}
                      type="button"
                      className={[
                        'px-2 py-1 text-sm font-medium transition-colors flex items-center gap-1',
                        isOnProducts
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      ].join(' ')}
                      aria-current={isOnProducts ? 'page' : undefined}
                    >
                      {t('nav.links.products')}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    onCloseAutoFocus={(event: Event) => {
                      event.preventDefault();
                      productsTriggerRef.current?.focus({
                        preventScroll: true,
                      });
                    }}
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        to="/canto-lyr"
                        aria-current={isOnCantoLyr ? 'page' : undefined}
                        className={
                          isOnCantoLyr
                            ? 'font-semibold text-foreground'
                            : undefined
                        }
                      >
                        {t('homepage.products.items.cantoLyr.label')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/canto-cap"
                        aria-current={isOnCantoCap ? 'page' : undefined}
                        className={
                          isOnCantoCap
                            ? 'font-semibold text-foreground'
                            : undefined
                        }
                      >
                        {t('homepage.products.items.cantoCap.label')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <LanguageSwitcher />
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80" forceMount>
              <Activity mode={mobileNavOpen ? 'visible' : 'hidden'}>
                <SheetHeader>
                  <SheetTitle>{t('nav.title')}</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 grid gap-2">
                  {links
                    .filter(l => l.key !== 'products')
                    .map(l => (
                      <SheetClose asChild key={l.key}>
                        <a
                          href={l.href}
                          onClick={e => handleNavClick(e, l.href)}
                          aria-current={
                            activeId && l.href === `#${activeId}`
                              ? 'page'
                              : undefined
                          }
                          className={[
                            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            activeId && l.href === `#${activeId}`
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                          ].join(' ')}
                        >
                          {t(`nav.links.${l.key}`)}
                        </a>
                      </SheetClose>
                    ))}
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {t('nav.links.products')}
                    </div>
                    <div className="ml-4 space-y-1">
                      <SheetClose asChild>
                        <Link
                          to="/canto-lyr"
                          aria-current={isOnCantoLyr ? 'page' : undefined}
                          className={[
                            'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isOnCantoLyr
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                          ].join(' ')}
                        >
                          {t('homepage.products.items.cantoLyr.label')}
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/canto-cap"
                          aria-current={isOnCantoCap ? 'page' : undefined}
                          className={[
                            'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isOnCantoCap
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                          ].join(' ')}
                        >
                          {t('homepage.products.items.cantoCap.label')}
                        </Link>
                      </SheetClose>
                    </div>
                  </div>
                </nav>
              </Activity>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
