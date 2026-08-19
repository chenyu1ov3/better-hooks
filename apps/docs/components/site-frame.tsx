import type { ReactNode } from 'react';
import { searchIndex } from '../lib/content';
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
    <div className="site-frame">
      <a className="skip-link" href="#main-content">
        {dictionary.common.skipToContent}
      </a>
      <SiteHeader locale={locale} currentPath={currentPath} searchEntries={searchIndex(locale)} />
      <main id="main-content" className={mainClassName} tabIndex={-1}>
        {children}
      </main>
      {showFooter ? <SiteFooter locale={locale} /> : null}
    </div>
  );
}
