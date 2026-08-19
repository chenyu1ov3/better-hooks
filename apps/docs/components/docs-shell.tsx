import Link from 'next/link';
import type { ReactNode } from 'react';
import { hrefFor, type Heading } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { documentationNavigation } from '../lib/navigation';
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
    <div className="docs-layout page-container">
      <MobileDocsNavigation
        groups={groups}
        currentHref={currentHref}
        label={dictionary.navigation.docs}
        closeLabel={dictionary.actions.closeMenu}
      />
      <aside className="docs-sidebar" aria-label={dictionary.navigation.docs}>
        <nav className="docs-navigation" aria-label={dictionary.navigation.docs}>
          {groups.map((group) => (
            <section key={group.label}>
              <p className="section-label">{group.label}</p>
              <div className="docs-navigation__links">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.href === currentHref ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </aside>
      <div className="docs-content">{children}</div>
      <TableOfContents headings={headings} label={dictionary.docs.onThisPage} />
    </div>
  );
}
