'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';

type DocumentNavigationLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'>;

export function DocumentNavigationLink({ onClick, ...props }: DocumentNavigationLinkProps) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    const anchor = event.currentTarget;
    const href = anchor.href;
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (anchor.target !== '' && anchor.target !== '_self') ||
      anchor.hasAttribute('download')
    ) {
      return;
    }

    event.preventDefault();
    window.location.assign(href);
  }

  return <Link {...props} prefetch={false} onClick={navigate} />;
}
