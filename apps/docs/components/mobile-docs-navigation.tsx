'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
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
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="mb-6 print:hidden lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="min-h-11 gap-2 px-3 text-sm">
            <Menu aria-hidden="true" size={17} />
            {label}
          </Button>
        </SheetTrigger>
        <SheetContent
          className="h-dvh w-[min(22.5rem,92vw)] max-w-none gap-0 overflow-y-auto overscroll-contain border-r bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-none"
          side="left"
          aria-describedby={undefined}
        >
          <SheetHeader className="mb-5 flex min-h-13 flex-row items-center justify-between gap-3 border-b border-border p-0">
            <SheetTitle>{label}</SheetTitle>
            <SheetClose asChild>
              <Button
                className="size-11"
                variant="ghost"
                size="icon-lg"
                type="button"
                aria-label={closeLabel}
              >
                <X aria-hidden="true" size={18} />
              </Button>
            </SheetClose>
          </SheetHeader>
          <nav className="grid gap-7" aria-label={label}>
            {groups.map((group) => (
              <section className="min-w-0" key={group.label}>
                <p className="m-0 text-xs font-bold text-foreground uppercase">{group.label}</p>
                <div className="mt-2 grid gap-px">
                  {group.items.map((item) => (
                    <Link
                      className="flex min-h-11 items-center border-l-2 border-transparent px-2.5 py-1.5 text-sm text-muted-foreground transition-[color,background-color,border-color] hover:text-foreground aria-[current=page]:border-brand aria-[current=page]:bg-brand/8 aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
                      key={item.href}
                      href={item.href}
                      prefetch={false}
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
