'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { NavItem } from '../lib/navigation';
import { siteConfig } from '../lib/site';
import { SiteLink } from './site-link';

export function MobileNavigation({
  items,
  currentHref,
  menuLabel,
  closeLabel,
  githubLabel,
}: {
  items: NavItem[];
  currentHref: string;
  menuLabel: string;
  closeLabel: string;
  githubLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-11 xl:hidden"
          aria-label={menuLabel}
        >
          <Menu aria-hidden="true" size={19} />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="h-dvh w-[min(22.5rem,92vw)] max-w-none gap-0 overscroll-contain border-l bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-none"
        side="right"
        aria-describedby={undefined}
      >
        <SheetHeader className="flex min-h-13 flex-row items-center justify-between gap-3 border-b border-border p-0">
          <SheetTitle className="text-xs font-bold text-foreground uppercase">
            {menuLabel}
          </SheetTitle>
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-11"
              aria-label={closeLabel}
            >
              <X aria-hidden="true" size={19} />
            </Button>
          </SheetClose>
        </SheetHeader>
        <nav className="grid pt-5" aria-label={menuLabel}>
          {items.map((item) => (
            <SiteLink
              className="flex min-h-13 items-center border-b border-border px-2 text-base font-semibold text-muted-foreground transition-[color,background-color] hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
              key={item.href}
              href={item.href}
              aria-current={
                currentHref === item.href || currentHref.startsWith(`${item.href}/`)
                  ? 'page'
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              {item.label}
            </SiteLink>
          ))}
          <a
            className="flex min-h-13 items-center border-b border-border px-2 text-base font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href={siteConfig.repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            {githubLabel}
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
