'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Locale } from '../lib/i18n';
import { LiveCodeWorkbench } from './live-code-workbench';

export type PlaygroundEntry = {
  readonly code: string;
  readonly name: string;
  readonly slug: string;
  readonly sourceUrl: string;
};

const defaultSlug = 'use-debounce';

export function InteractivePlayground({
  entries,
  locale,
}: {
  readonly entries: readonly PlaygroundEntry[];
  readonly locale: Locale;
}) {
  const fallback = entries.find((entry) => entry.slug === defaultSlug) ?? entries[0];
  const [selectedSlug, setSelectedSlug] = useState(fallback?.slug ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const requestedSlug = new URLSearchParams(window.location.search).get('hook');
    if (requestedSlug && entries.some((entry) => entry.slug === requestedSlug)) {
      setSelectedSlug(requestedSlug);
    }
  }, [entries]);

  const selected = entries.find((entry) => entry.slug === selectedSlug) ?? fallback;
  if (!selected) return null;

  function choose(slug: string) {
    setSelectedSlug(slug);
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('hook', slug);
    window.history.replaceState(null, '', url);
  }

  function updateDraft(code: string) {
    setDrafts((current) => ({ ...current, [selected.slug]: code }));
  }

  return (
    <div className="playground-workbench live-playground min-w-0">
      <div className="flex min-h-16 flex-col gap-3 rounded-t-md border border-b-0 border-border bg-muted p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="shrink-0 text-sm font-medium text-foreground" id="playground-hook-label">
            {locale === 'en' ? 'Example' : '示例'}
          </span>
          <Select value={selected.slug} onValueChange={choose}>
            <SelectTrigger
              id="playground-hook"
              className="h-11! w-full min-w-0 border-border-strong bg-background font-mono text-xs shadow-none hover:border-foreground/60 focus-visible:border-foreground dark:border-zinc-500 dark:bg-background sm:w-[260px]"
              aria-labelledby="playground-hook-label"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="max-h-[min(420px,var(--radix-select-content-available-height))] font-mono"
              position="popper"
              align="start"
            >
              {entries.map((entry) => (
                <SelectItem key={entry.slug} value={entry.slug}>
                  {entry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {locale === 'en' ? `${entries.length} public entries` : `${entries.length} 个公开入口`}
        </span>
      </div>
      <LiveCodeWorkbench
        code={drafts[selected.slug] ?? selected.code}
        initialCode={selected.code}
        locale={locale}
        name={selected.name}
        onCodeChange={updateDraft}
        sourceUrl={selected.sourceUrl}
        variant="playground"
      />
    </div>
  );
}
