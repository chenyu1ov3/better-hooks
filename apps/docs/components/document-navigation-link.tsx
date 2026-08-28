'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

type DocumentNavigationLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'>;

export function DocumentNavigationLink(props: DocumentNavigationLinkProps) {
  return <Link {...props} prefetch={false} />;
}
