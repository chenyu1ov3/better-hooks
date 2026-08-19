'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import type { NavItem } from '../lib/navigation';
import { siteConfig } from '../lib/site';

export function MobileNavigation({
  items,
  menuLabel,
  closeLabel,
  githubLabel,
}: {
  items: NavItem[];
  menuLabel: string;
  closeLabel: string;
  githubLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="icon-button mobile-menu-button"
        aria-label={menuLabel}
        title={menuLabel}
        onClick={() => dialogRef.current?.showModal()}
      >
        <Menu aria-hidden="true" size={19} />
      </button>
      <dialog className="mobile-menu" ref={dialogRef} aria-label={menuLabel}>
        <div className="mobile-menu__header">
          <span className="eyebrow">{menuLabel}</span>
          <button
            type="button"
            className="icon-button"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={() => dialogRef.current?.close()}
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>
        <nav className="mobile-menu__links" aria-label={menuLabel}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => dialogRef.current?.close()}>
              {item.label}
            </Link>
          ))}
          <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer">
            {githubLabel}
          </a>
        </nav>
      </dialog>
    </>
  );
}
