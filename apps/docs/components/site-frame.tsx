import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { hrefFor, searchIndex } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function SiteFrame({
  locale,
  currentPath,
  children,
  mainClassName,
  showFooter = true,
}: {
  locale: Locale;
  currentPath: string[];
  children: ReactNode;
  mainClassName?: string;
  showFooter?: boolean;
}) {
  const dictionary = dictionaryFor(locale);
  return (
    <div className="flex min-h-dvh flex-col" data-site-route={hrefFor(locale, currentPath)}>
      <a
        className="fixed top-2.5 left-3 z-[100] -translate-y-[160%] rounded-md border border-border bg-background px-3 py-2 text-sm font-bold text-foreground shadow-md transition-transform duration-150 focus:translate-y-0"
        href="#main-content"
      >
        {dictionary.common.skipToContent}
      </a>
      <SiteHeader locale={locale} currentPath={currentPath} searchEntries={searchIndex(locale)} />
      <main id="main-content" className={cn('min-w-0 flex-1', mainClassName)} tabIndex={-1}>
        {children}
      </main>
      {showFooter ? <SiteFooter locale={locale} /> : null}
    </div>
  );
}
