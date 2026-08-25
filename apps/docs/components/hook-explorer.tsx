'use client';

import { ArrowUpRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
    <div className="hook-explorer">
      {compact ? null : (
        <h2 className="sr-only">{locale === 'en' ? 'Hook results' : 'Hook 搜索结果'}</h2>
      )}
      <div className="hook-explorer__tools">
        <label className="explorer-search">
          <span className="sr-only">{dictionary.search.label}</span>
          <Search aria-hidden="true" size={18} />
          <input
            type="search"
            value={query}
            placeholder={dictionary.search.placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={dictionary.search.clear}
              title={dictionary.search.clear}
            >
              <X aria-hidden="true" size={16} />
            </button>
          ) : null}
        </label>
        <div className="category-filter" aria-label={dictionary.filters.categories}>
          <button
            type="button"
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            {dictionary.filters.all}
          </button>
          {hookCategories.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {categoryLabel(value)}
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" role="status" aria-atomic="true">
        {resultCountLabel}
      </p>
      <div className="hook-results">
        {matches.map((hook) => (
          <article className="hook-result" key={hook.slug}>
            <div className="hook-result__topline">
              <span>{categoryLabel(hook.category)}</span>
              <span>{dictionary.common.react19}</span>
            </div>
            <h3>
              <Link href={hrefFor(locale, ['hooks', hook.slug])}>{hook.name}</Link>
            </h3>
            <p>{hook.description[locale]}</p>
            <code>{hook.signature}</code>
            <div className="hook-result__links">
              <Link href={hrefFor(locale, ['hooks', hook.slug])}>
                {dictionary.actions.viewDocs}
                <ArrowUpRight aria-hidden="true" size={14} />
              </Link>
              <a href={hook.sourceUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </article>
        ))}
        {!matches.length ? <p className="empty-state">{dictionary.search.noResults}</p> : null}
      </div>
    </div>
  );
}
