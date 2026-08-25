'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dictionaryFor, type Locale } from '../lib/i18n';

type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'better-hooks:prefs:v1';
const themeColors = { light: '#ffffff', dark: '#09090b' } as const;

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
  const [themeColor, ...duplicates] = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  themeColor?.setAttribute('content', themeColors[resolved]);
  duplicates.forEach((meta) => meta.remove());
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

  const CurrentIcon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Monitor;
  const options = [
    { value: 'system' as const, label: labels.system, icon: Monitor },
    { value: 'light' as const, label: labels.light, icon: Sun },
    { value: 'dark' as const, label: labels.dark, icon: Moon },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-11"
          aria-label={labels.theme}
        >
          <CurrentIcon aria-hidden="true" size={17} strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44 border-border shadow-sm" align="end" sideOffset={8}>
        <DropdownMenuRadioGroup
          aria-label={labels.theme}
          value={preference}
          onValueChange={(value) => updatePreference(value as ThemePreference)}
        >
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuRadioItem
                className="min-h-10 text-[13px]"
                key={option.value}
                value={option.value}
              >
                <Icon aria-hidden="true" size={16} />
                <span>{option.label}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
