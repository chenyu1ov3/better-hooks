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
    <div className="page-container grid min-w-0 grid-cols-1 gap-0 pt-6 pb-24 lg:grid-cols-[13.75rem_minmax(0,49.375rem)] lg:justify-center lg:gap-10 lg:pt-11 lg:pb-28 xl:grid-cols-[13.75rem_minmax(0,49.375rem)_11.875rem] xl:gap-12">
      <MobileDocsNavigation
        groups={groups}
        currentHref={currentHref}
        label={dictionary.navigation.docs}
        closeLabel={dictionary.actions.closeMenu}
      />
      <aside
        className="hidden min-w-0 print:hidden lg:block"
        aria-label={dictionary.navigation.docs}
      >
        <nav
          className="sticky top-[calc(var(--header-height)+1.5rem)] grid max-h-[calc(100dvh-var(--header-height)-3rem)] gap-7 overflow-y-auto pr-2 [scrollbar-width:thin]"
          aria-label={dictionary.navigation.docs}
        >
          {groups.map((group) => (
            <section className="min-w-0" key={group.label}>
              <p className="m-0 text-xs font-bold text-foreground uppercase">{group.label}</p>
              <div className="mt-2 grid gap-px">
                {group.items.map((item) => (
                  <Link
                    className="flex min-h-9 items-center border-l-2 border-transparent px-2.5 py-1 text-[13px] leading-5 text-muted-foreground transition-[color,background-color,border-color] hover:text-foreground aria-[current=page]:border-brand aria-[current=page]:bg-brand/8 aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
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
      <div className="min-w-0">
        <TableOfContents headings={headings} label={dictionary.docs.onThisPage} variant="mobile" />
        {children}
      </div>
      <TableOfContents headings={headings} label={dictionary.docs.onThisPage} variant="desktop" />
    </div>
  );
}
