import { ChevronDown, FileCode2, SquareTerminal } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './code-block.module.css';
import {
  codeBlockLabels,
  codeBlockVariant,
  isConsoleLanguage,
  isPowerShellLanguage,
  normalizeCodeLanguage,
} from './code-block-config';
import { CodeCopyButton } from './code-copy-button';
import type { Locale } from '../lib/i18n';

function CodeBar({
  code,
  language,
  filename,
  locale,
  expandable,
}: {
  code: string;
  language: string;
  filename?: string;
  locale: Locale;
  expandable?: boolean;
}) {
  const variant = codeBlockVariant(language);
  const Icon = variant === 'terminal' ? SquareTerminal : FileCode2;
  const label = (
    <span className="flex min-w-0 items-center gap-2.5">
      <Icon aria-hidden="true" className="size-4 text-[var(--code-muted)]" />
      {filename ? (
        <>
          <span className="truncate text-xs font-medium text-[var(--code-foreground)]">
            {filename}
          </span>
          <span className="shrink-0 border-l border-[var(--code-border)] pl-2.5 font-mono text-[10px] font-semibold text-[var(--code-muted)] uppercase">
            {language}
          </span>
        </>
      ) : (
        <span className="truncate font-mono text-[11px] font-semibold text-[var(--code-muted)] uppercase">
          {language}
        </span>
      )}
    </span>
  );
  if (expandable) {
    return (
      <>
        <summary className="flex min-h-12 list-none items-center justify-between gap-3 border-b border-[var(--code-border)] bg-[var(--code-header)] py-1 pr-14 pl-3 marker:hidden [&::-webkit-details-marker]:hidden">
          {label}
          <ChevronDown
            className="size-4 text-[var(--code-muted)] transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </summary>
        <div className="absolute top-0.5 right-1.5 z-10 sm:top-1.5">
          <CodeCopyButton value={code} labels={codeBlockLabels(locale)} />
        </div>
      </>
    );
  }
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--code-border)] bg-[var(--code-header)] py-1 pr-1.5 pl-3 sm:min-h-11">
      {label}
      <CodeCopyButton value={code} labels={codeBlockLabels(locale)} />
    </div>
  );
}

export function CodeBlockFrame({
  children,
  code,
  language,
  filename,
  locale = 'en',
  expandable,
  defaultOpen = true,
  withinFigure = false,
}: {
  children: ReactNode;
  code: string;
  language: string;
  filename?: string;
  locale?: Locale;
  expandable?: boolean;
  defaultOpen?: boolean;
  withinFigure?: boolean;
}) {
  const normalizedLanguage = normalizeCodeLanguage(language);
  const variant = codeBlockVariant(normalizedLanguage);
  const sourceClassName = cn(
    styles.source,
    variant === 'terminal' && styles.terminal,
    isPowerShellLanguage(normalizedLanguage) && styles.powershell,
    isConsoleLanguage(normalizedLanguage) && styles.console,
  );
  const frameClassName = cn(
    'relative min-w-0 overflow-hidden rounded-md border border-[var(--code-border)] bg-[var(--code-background)] text-[var(--code-foreground)] shadow-sm',
    withinFigure ? 'my-0' : 'my-7',
  );

  if (expandable) {
    return (
      <details
        className={cn(frameClassName, 'group')}
        open={defaultOpen}
        data-code-variant={variant}
        data-language={normalizedLanguage}
      >
        <CodeBar
          code={code}
          language={normalizedLanguage}
          filename={filename}
          locale={locale}
          expandable
        />
        <div className={sourceClassName}>{children}</div>
      </details>
    );
  }
  return (
    <div className={frameClassName} data-code-variant={variant} data-language={normalizedLanguage}>
      <CodeBar code={code} language={normalizedLanguage} filename={filename} locale={locale} />
      <div className={sourceClassName}>{children}</div>
    </div>
  );
}
