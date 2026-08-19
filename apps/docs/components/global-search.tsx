'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchEntry } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function GlobalSearch({ locale, entries }: { locale: Locale; entries: SearchEntry[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dictionary = dictionaryFor(locale);
  const labels = {
    open: dictionary.search.label,
    close: dictionary.actions.closeMenu,
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
        if (!dialogRef.current?.open) dialogRef.current?.showModal();
        setIsOpen(true);
        if (window.matchMedia('(pointer: fine)').matches) {
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  function open() {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    setIsOpen(true);
    if (window.matchMedia('(pointer: fine)').matches) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function reset() {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }

  function close() {
    dialogRef.current?.close();
    reset();
  }

  function visit(href: string) {
    close();
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={open}
        aria-label={labels.open}
        title={labels.open}
      >
        <Search aria-hidden="true" size={17} />
        <span>{labels.open}</span>
      </button>
      <dialog className="search-dialog" ref={dialogRef} aria-label={labels.open} onClose={reset}>
        <div className="search-dialog__field">
          <Search aria-hidden="true" size={18} />
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
            aria-autocomplete="list"
            aria-controls="global-docs-search-results"
            aria-expanded={isOpen}
            aria-activedescendant={
              matches[activeIndex] ? `global-docs-search-option-${activeIndex}` : undefined
            }
            value={query}
            placeholder={labels.placeholder}
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
          <button
            type="button"
            className="icon-button"
            aria-label={labels.close}
            title={labels.close}
            onClick={close}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="search-dialog__results">
          <div id="global-docs-search-results" role="listbox" aria-label={labels.results}>
            <ul role="presentation">
              {matches.map((entry, index) => (
                <li key={entry.href} role="none">
                  <Link
                    id={`global-docs-search-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    className={index === activeIndex ? 'is-active' : undefined}
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
                    <span>
                      <strong>{entry.title}</strong>
                      {entry.section ? <small>{entry.section}</small> : null}
                    </span>
                    <p>{entry.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {!matches.length ? (
            <p className="search-dialog__empty" aria-live="polite">
              {labels.empty}
            </p>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
