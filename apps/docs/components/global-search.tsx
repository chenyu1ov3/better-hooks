'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { SearchEntry } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function GlobalSearch({ locale, entries }: { locale: Locale; entries: SearchEntry[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dictionary = dictionaryFor(locale);
  const labels = {
    open: dictionary.search.label,
    close: locale === 'en' ? 'Close search' : '关闭搜索',
    input: dictionary.search.label,
    placeholder: dictionary.search.placeholder,
    empty: dictionary.search.noResults,
    results: dictionary.search.label,
  };

  const matches = useMemo(() => {
    const needle = normalized(query);
    if (!needle) return entries.slice(0, 7);
    return entries
      .filter((entry) =>
        normalized(
          [entry.title, entry.description, entry.section, ...entry.headings].join(' '),
        ).includes(needle),
      )
      .slice(0, 8);
  }, [entries, query]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  function reset() {
    setQuery('');
    setActiveIndex(0);
  }

  function close() {
    setIsOpen(false);
    reset();
  }

  function visit(href: string) {
    close();
    router.push(href);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-11 gap-2 border-border bg-background px-0 text-xs text-muted-foreground shadow-none lg:w-44 lg:justify-start lg:px-3"
          aria-label={labels.open}
        >
          <Search aria-hidden="true" size={17} />
          <span className="hidden min-w-0 truncate lg:inline">{labels.open}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[74dvh] w-[min(42.5rem,calc(100%-2rem))] gap-0 overflow-hidden overscroll-contain rounded-lg border-border-strong p-0 shadow-xl sm:max-w-[680px]"
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">{labels.open}</DialogTitle>
        <div className="grid min-h-15 grid-cols-[1.5rem_minmax(0,1fr)_2.75rem] items-center gap-2 border-b border-border px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset sm:px-4">
          <Search className="text-muted-foreground" aria-hidden="true" size={18} />
          <label className="sr-only" htmlFor="global-docs-search">
            {labels.input}
          </label>
          <input
            ref={inputRef}
            id="global-docs-search"
            name="docs-search"
            type="search"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-controls="global-docs-search-results"
            aria-expanded={isOpen}
            aria-activedescendant={
              matches[activeIndex] ? `global-docs-search-option-${activeIndex}` : undefined
            }
            value={query}
            placeholder={labels.placeholder}
            className="h-11 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (matches.length) {
                  setActiveIndex((current) => Math.min(current + 1, matches.length - 1));
                }
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (matches.length) setActiveIndex((current) => Math.max(current - 1, 0));
              } else if (event.key === 'Enter' && matches[activeIndex]) {
                event.preventDefault();
                visit(matches[activeIndex].href);
              }
            }}
          />
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={labels.close}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </DialogClose>
        </div>
        <div className="max-h-[calc(74dvh-3.75rem)] overflow-y-auto p-2">
          <div id="global-docs-search-results" role="listbox" aria-label={labels.results}>
            <ul className="m-0 list-none p-0" role="presentation">
              {matches.map((entry, index) => (
                <li key={entry.href} role="none">
                  <Link
                    id={`global-docs-search-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    className="grid min-h-17 min-w-0 grid-cols-1 gap-1 rounded-md px-3 py-2.5 transition-colors hover:bg-muted aria-selected:bg-muted sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4"
                    href={entry.href}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={(event) => {
                      if (
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        close();
                      }
                    }}
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-foreground">
                        {entry.title}
                      </strong>
                      {entry.section ? (
                        <small className="block truncate text-xs text-brand">{entry.section}</small>
                      ) : null}
                    </span>
                    <p className="m-0 line-clamp-2 min-w-0 text-[13px] leading-5 text-muted-foreground">
                      {entry.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {!matches.length ? (
            <p
              className="m-0 px-4 py-8 text-center text-sm text-muted-foreground"
              aria-live="polite"
            >
              {labels.empty}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
