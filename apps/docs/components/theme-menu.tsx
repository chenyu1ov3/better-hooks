'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { dictionaryFor, type Locale } from '../lib/i18n';

type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'better-hooks:prefs:v1';

function applyTheme(preference: ThemePreference) {
  const resolved =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return 'system';
    const parsed = JSON.parse(stored) as { theme?: unknown };
    return parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system'
      ? parsed.theme
      : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeMenu({ locale }: { locale: Locale }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [preference, setPreference] = useState<ThemePreference>('system');
  const dictionary = dictionaryFor(locale);
  const labels = {
    theme: dictionary.theme.label,
    system: dictionary.theme.system,
    light: dictionary.theme.light,
    dark: dictionary.theme.dark,
  };

  useEffect(() => {
    const initial = readPreference();
    setPreference(initial);
    applyTheme(initial);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (readPreference() === 'system') applyTheme('system');
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  function updatePreference(next: ThemePreference) {
    setPreference(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ theme: next }));
    } catch {
      // The applied in-memory preference still works when storage is unavailable.
    }
  }

  function choose(next: ThemePreference) {
    updatePreference(next);
    detailsRef.current?.removeAttribute('open');
  }

  const CurrentIcon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Monitor;
  const options = [
    { value: 'system' as const, label: labels.system, icon: Monitor },
    { value: 'light' as const, label: labels.light, icon: Sun },
    { value: 'dark' as const, label: labels.dark, icon: Moon },
  ];

  function moveSelection(index: number) {
    const option = options[index];
    if (!option) return;
    updatePreference(option.value);
    optionRefs.current[index]?.focus();
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (index + 1) % options.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = options.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    moveSelection(nextIndex);
  }

  return (
    <details className="control-menu" ref={detailsRef}>
      <summary className="icon-button" aria-label={labels.theme} title={labels.theme}>
        <CurrentIcon aria-hidden="true" size={17} strokeWidth={1.8} />
      </summary>
      <div className="control-menu__panel" role="radiogroup" aria-label={labels.theme}>
        {options.map((option, index) => {
          const Icon = option.icon;
          return (
            <button
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={preference === option.value}
              tabIndex={preference === option.value ? 0 : -1}
              className="control-menu__option"
              key={option.value}
              onClick={() => choose(option.value)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <Icon aria-hidden="true" size={16} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
