'use client';

import { useEffect, useState } from 'react';
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
    <div className="playground-workbench live-playground">
      <div className="live-playground__selector">
        <label htmlFor="playground-hook">
          {locale === 'en' ? 'Example' : '示例'}
          <select
            id="playground-hook"
            value={selected.slug}
            onChange={(event) => choose(event.target.value)}
          >
            {entries.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <span>
          {locale === 'en' ? `${entries.length} public entries` : `${entries.length} 个公开入口`}
        </span>
      </div>
      <LiveCodeWorkbench
        code={drafts[selected.slug] ?? selected.code}
        defaultSourceOpen
        initialCode={selected.code}
        locale={locale}
        name={selected.name}
        onCodeChange={updateDraft}
        sourceUrl={selected.sourceUrl}
      />
    </div>
  );
}
