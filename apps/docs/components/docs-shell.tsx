import type { ReactNode } from 'react';
import { hrefFor, type Heading } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { documentationNavigation } from '../lib/navigation';
import { DesktopDocsNavigation } from './desktop-docs-navigation';
import { MobileDocsNavigation } from './mobile-docs-navigation';
import { TableOfContents } from './table-of-contents';

export function DocsShell({
  locale,
  currentPath,
  headings,
  children,
}: {
  locale: Locale;
  currentPath: string[];
  headings: Heading[];
  children: ReactNode;
}) {
  const dictionary = dictionaryFor(locale);
  const groups = documentationNavigation(locale);
  const currentHref = hrefFor(locale, currentPath);
  return (
    <div className="page-container grid min-w-0 grid-cols-1 gap-0 pt-6 pb-24 lg:grid-cols-[13.75rem_minmax(0,49.375rem)] lg:justify-center lg:gap-10 lg:pt-11 lg:pb-28 xl:grid-cols-[13.75rem_minmax(0,49.375rem)_11.875rem] xl:gap-12">
      <MobileDocsNavigation
        groups={groups}
        currentHref={currentHref}
        label={dictionary.navigation.docs}
        closeLabel={dictionary.actions.closeMenu}
      />
      <DesktopDocsNavigation
        groups={groups}
        currentHref={currentHref}
        label={dictionary.navigation.docs}
      />
      <div className="min-w-0">
        <TableOfContents headings={headings} label={dictionary.docs.onThisPage} variant="mobile" />
        {children}
      </div>
      <TableOfContents headings={headings} label={dictionary.docs.onThisPage} variant="desktop" />
    </div>
  );
}
