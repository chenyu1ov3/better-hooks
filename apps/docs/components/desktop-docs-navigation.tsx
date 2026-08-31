'use client';

import { useLayoutEffect, useRef } from 'react';
import type { NavGroup } from '../lib/navigation';
import { SiteLink } from './site-link';

export function DesktopDocsNavigation({
  groups,
  currentHref,
  label,
}: {
  groups: NavGroup[];
  currentHref: string;
  label: string;
}) {
  const navigationRef = useRef<HTMLElement>(null);
  const activeGroupRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    const activeGroup = activeGroupRef.current;
    if (!navigation || !activeGroup) return;

    const navigationTop = navigation.getBoundingClientRect().top;
    const groupTop = activeGroup.getBoundingClientRect().top;
    const maxScrollTop = navigation.scrollHeight - navigation.clientHeight;
    const nextScrollTop = navigation.scrollTop + groupTop - navigationTop;
    navigation.scrollTop = Math.max(0, Math.min(nextScrollTop, maxScrollTop));
  }, [currentHref]);

  return (
    <aside className="hidden min-w-0 print:hidden lg:block" aria-label={label}>
      <nav
        ref={navigationRef}
        className="sticky top-[calc(var(--header-height)+1.5rem)] grid max-h-[calc(100dvh-var(--header-height)-3rem)] gap-7 overflow-y-auto pr-2 [scrollbar-width:thin]"
        aria-label={label}
        data-docs-navigation="desktop"
      >
        {groups.map((group) => {
          const active = group.items.some((item) => item.href === currentHref);
          return (
            <section
              className="min-w-0"
              key={group.label}
              ref={active ? activeGroupRef : undefined}
            >
              <p className="m-0 text-xs font-bold text-foreground uppercase">{group.label}</p>
              <div className="mt-2 grid gap-px">
                {group.items.map((item) => (
                  <SiteLink
                    className="flex min-h-9 items-center border-l-2 border-transparent px-2.5 py-1 text-[13px] leading-5 text-muted-foreground transition-[color,background-color,border-color] hover:text-foreground aria-[current=page]:border-brand aria-[current=page]:bg-brand/8 aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
                    key={item.href}
                    href={item.href}
                    aria-current={item.href === currentHref ? 'page' : undefined}
                  >
                    {item.label}
                  </SiteLink>
                ))}
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
