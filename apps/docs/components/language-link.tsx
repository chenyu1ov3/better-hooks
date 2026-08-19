'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';

export function LanguageLink({
  href,
  hrefLang,
  children,
}: {
  href: string;
  hrefLang: string;
  children: ReactNode;
}) {
  const router = useRouter();

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
    router.push(`${href}${suffix}`);
  }

  return (
    <Link className="language-link" href={href} hrefLang={hrefLang} onClick={preserveLocationState}>
      {children}
    </Link>
  );
}
