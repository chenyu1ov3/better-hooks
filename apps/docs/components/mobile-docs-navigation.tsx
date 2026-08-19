'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import type { NavGroup } from '../lib/navigation';

export function MobileDocsNavigation({
  groups,
  currentHref,
  label,
  closeLabel,
}: {
  groups: NavGroup[];
  currentHref: string;
  label: string;
  closeLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();
  return (
    <div className="mobile-docs-nav">
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        <Menu aria-hidden="true" size={17} />
        {label}
      </button>
      <dialog ref={dialogRef} aria-label={label}>
        <div className="mobile-docs-nav__header">
          <strong>{label}</strong>
          <button className="icon-button" type="button" onClick={close} aria-label={closeLabel}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <nav className="docs-navigation" aria-label={label}>
          {groups.map((group) => (
            <section key={group.label}>
              <p className="section-label">{group.label}</p>
              <div className="docs-navigation__links">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.href === currentHref ? 'page' : undefined}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </dialog>
    </div>
  );
}
