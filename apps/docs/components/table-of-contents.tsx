'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Heading } from '../lib/content';

function TocLinks({
  headings,
  label,
  activeId,
  onNavigate,
}: {
  headings: Heading[];
  label: string;
  activeId?: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="mt-2 grid" aria-label={label}>
      {headings.map((heading) => {
        const active = activeId === heading.id;
        return (
          <a
            key={heading.id}
            className={cn(
              'flex min-h-11 items-center border-l-2 px-3 py-2 text-sm leading-snug transition-colors hover:border-brand hover:text-foreground focus-visible:border-brand xl:min-h-8 xl:py-1 xl:text-xs',
              heading.level === 3 && 'pl-6 xl:pl-5',
              active
                ? 'border-brand font-semibold text-foreground'
                : 'border-border text-muted-foreground',
            )}
            href={`#${heading.id}`}
            aria-current={active ? 'location' : undefined}
            onClick={() => onNavigate(heading.id)}
          >
            {heading.text}
          </a>
        );
      })}
    </nav>
  );
}

export function TableOfContents({
  headings,
  label,
  variant,
}: {
  headings: Heading[];
  label: string;
  variant: 'mobile' | 'desktop';
}) {
  const [activeId, setActiveId] = useState<string | undefined>(headings[0]?.id);

  useEffect(() => {
    const headingIds = headings.map((heading) => heading.id);
    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (!elements.length) return;

    function updateActiveHeading() {
      const activationLine = Math.min(160, window.innerHeight * 0.25);
      let current = elements[0];

      for (const element of elements) {
        if (element.getBoundingClientRect().top > activationLine) break;
        current = element;
      }

      const atPageEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActiveId(atPageEnd ? elements.at(-1)?.id : current.id);
    }

    function syncFromHash() {
      const hashId = decodeURIComponent(window.location.hash.slice(1));
      if (headingIds.includes(hashId)) setActiveId(hashId);
    }

    const observer = new IntersectionObserver(updateActiveHeading, {
      rootMargin: '-96px 0px -65% 0px',
      threshold: [0, 1],
    });
    elements.forEach((element) => observer.observe(element));
    window.addEventListener('hashchange', syncFromHash);
    syncFromHash();
    updateActiveHeading();

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [headings]);

  if (!headings.length) return null;

  if (variant === 'mobile') {
    return (
      <details
        className="group mb-8 rounded-md border border-border bg-background px-3 py-1 xl:hidden print:hidden"
        data-toc-variant="mobile"
      >
        <summary className="flex min-h-11 list-none items-center justify-between gap-3 text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
          {label}
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </summary>
        <TocLinks headings={headings} label={label} activeId={activeId} onNavigate={setActiveId} />
      </details>
    );
  }

  return (
    <aside
      className="sticky top-[calc(var(--header-height)+1.5rem)] hidden max-h-[calc(100vh-var(--header-height)-3rem)] self-start overflow-y-auto xl:block print:hidden"
      aria-label={label}
      data-toc-variant="desktop"
    >
      <p className="m-0 text-xs font-semibold text-foreground">{label}</p>
      <TocLinks headings={headings} label={label} activeId={activeId} onNavigate={setActiveId} />
    </aside>
  );
}
