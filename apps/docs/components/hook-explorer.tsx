'use client';

import { ArrowUpRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { apiEntries, hookCategories, type HookCategory } from '../lib/hooks';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { hrefFor } from '../lib/paths';

type CategoryFilter = HookCategory | 'all';

export function HookExplorer({
  locale,
  compact = false,
  syncUrl = false,
}: {
  locale: Locale;
  compact?: boolean;
  syncUrl?: boolean;
}) {
  const dictionary = dictionaryFor(locale);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [urlStateReady, setUrlStateReady] = useState(!syncUrl);
  const [announcedResultCount, setAnnouncedResultCount] = useState(
    compact ? Math.min(apiEntries.length, 8) : apiEntries.length,
  );

  useEffect(() => {
    if (!syncUrl) return;
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get('category');
    setQuery(params.get('q') ?? '');
    if (initialCategory && hookCategories.includes(initialCategory as HookCategory)) {
      setCategory(initialCategory as HookCategory);
    }
    setUrlStateReady(true);
  }, [syncUrl]);

  useEffect(() => {
    if (!syncUrl || !urlStateReady) return;
    const url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    window.history.replaceState(null, '', url);
  }, [category, query, syncUrl, urlStateReady]);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const result = apiEntries.filter(
      (entry) =>
        (category === 'all' || entry.category === category) &&
        (!needle ||
          `${entry.name} ${entry.description[locale]} ${entry.signature}`
            .toLocaleLowerCase()
            .includes(needle)),
    );
    return compact ? result.slice(0, 8) : result;
  }, [category, compact, locale, query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setAnnouncedResultCount(matches.length);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [matches.length]);

  const categoryLabel = (value: HookCategory) => dictionary.categories[value];
  const resultCountLabel =
    locale === 'en'
      ? `${announcedResultCount} API ${announcedResultCount === 1 ? 'entry' : 'entries'} found.`
      : `找到 ${announcedResultCount} 个 API 入口。`;

  return (
    <div className="mt-9 min-w-0">
      {compact ? null : (
        <h2 className="sr-only">{locale === 'en' ? 'Hook results' : 'Hook 搜索结果'}</h2>
      )}
      <div className="grid gap-4 border-b border-border pb-5">
        <label className="grid h-12 w-full max-w-[32.5rem] grid-cols-[1.375rem_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-md border border-border-strong bg-background pr-1 pl-3.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
          <span className="sr-only">{dictionary.search.label}</span>
          <Search className="text-muted-foreground" aria-hidden="true" size={18} />
          <input
            className="min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            name="hook-search"
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            placeholder={dictionary.search.placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="size-11"
                  onClick={() => setQuery('')}
                  aria-label={dictionary.search.clear}
                >
                  <X aria-hidden="true" size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{dictionary.search.clear}</TooltipContent>
            </Tooltip>
          ) : null}
        </label>
        <div
          className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
          aria-label={dictionary.filters.categories}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'min-h-11 shrink-0 px-3 text-xs sm:min-h-8',
              category === 'all'
                ? 'border-primary bg-primary! text-primary-foreground! hover:bg-primary!'
                : 'text-muted-foreground',
            )}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            {dictionary.filters.all}
          </Button>
          {hookCategories.map((value) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'min-h-11 shrink-0 px-3 text-xs sm:min-h-8',
                category === value
                  ? 'border-primary bg-primary! text-primary-foreground! hover:bg-primary!'
                  : 'text-muted-foreground',
              )}
              key={value}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {categoryLabel(value)}
            </Button>
          ))}
        </div>
      </div>
      <p className="sr-only" role="status" aria-atomic="true">
        {resultCountLabel}
      </p>
      <div className="grid grid-cols-1 border-l border-border lg:grid-cols-2">
        {matches.map((hook) => (
          <article
            className="flex min-h-58 min-w-0 flex-col border-r border-b border-border p-5 transition-colors duration-150 hover:bg-muted sm:p-6"
            key={hook.slug}
          >
            <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
              <Link
                className="underline-offset-4 hover:underline"
                href={hrefFor(locale, ['hooks', hook.slug])}
              >
                {hook.name}
              </Link>
            </h3>
            <p className="m-0 text-sm leading-6 text-muted-foreground">
              {hook.description[locale]}
            </p>
            <code className="mt-4 min-w-0 break-words font-mono text-xs leading-5 text-foreground">
              {hook.signature}
            </code>
            <div className="mt-auto flex gap-4 pt-5 text-xs font-semibold text-muted-foreground">
              <Link
                className="inline-flex min-h-11 items-center gap-1 transition-colors hover:text-brand sm:min-h-8"
                href={hrefFor(locale, ['hooks', hook.slug])}
              >
                {dictionary.actions.viewDocs}
                <ArrowUpRight aria-hidden="true" size={14} />
              </Link>
              <a
                className="inline-flex min-h-11 items-center transition-colors hover:text-brand sm:min-h-8"
                href={hook.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </article>
        ))}
        {!matches.length ? (
          <p className="col-span-full m-0 border-r border-b border-border px-6 py-12 text-center text-sm text-muted-foreground">
            {dictionary.search.noResults}
          </p>
        ) : null}
      </div>
    </div>
  );
}
