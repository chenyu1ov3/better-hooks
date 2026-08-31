'use client';

import type { MouseEvent, ReactNode } from 'react';
import { SiteLink } from './site-link';

export function LanguageLink({
  href,
  hrefLang,
  children,
}: {
  href: string;
  hrefLang: string;
  children: ReactNode;
}) {
  function preserveLocationState(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const suffix = `${window.location.search}${window.location.hash}`;
    if (!suffix) return;

    event.preventDefault();
    window.location.assign(`${event.currentTarget.href}${suffix}`);
  }

  return (
    <SiteLink
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs font-semibold whitespace-nowrap text-muted-foreground transition-[color,background-color] hover:bg-muted hover:text-foreground"
      href={href}
      hrefLang={hrefLang}
      onClick={preserveLocationState}
    >
      {children}
    </SiteLink>
  );
}
