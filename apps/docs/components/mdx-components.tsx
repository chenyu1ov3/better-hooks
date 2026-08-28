import { slug } from 'github-slugger';
import { isValidElement, type ComponentProps, type ReactNode } from 'react';
import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Heading as DocumentHeading } from '../lib/content';
import type { Locale } from '../lib/i18n';
import { PackageMetrics } from './package-metrics';
import { CodeBlock } from './code-block';

function Anchor({ href = '', children, ...props }: ComponentProps<'a'>) {
  const external = href.startsWith('http');
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href || '#'} {...props}>
      {children}
    </Link>
  );
}

function textContent(value: ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (isValidElement<{ children?: ReactNode }>(value)) return textContent(value.props.children);
  return '';
}

function headingKey(level: 2 | 3, text: string) {
  return `${level}:${text}`;
}

function headingIdResolver(headings: DocumentHeading[]) {
  const headingIds = new Map<string, string[]>();
  const occurrences = new Map<string, number>();
  const reservedIds = new Set(headings.map((heading) => heading.id));
  const assignedIds = new Set<string>();

  for (const heading of headings) {
    const key = headingKey(heading.level, heading.text);
    headingIds.set(key, [...(headingIds.get(key) ?? []), heading.id]);
  }

  function uniqueFallback(text: string) {
    const base = slug(text) || 'section';
    let id = base;
    let suffix = 1;
    while (reservedIds.has(id) || assignedIds.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    assignedIds.add(id);
    return id;
  }

  return (level: 1 | 2 | 3, text: string) => {
    if (level === 1) return uniqueFallback(text);

    const key = headingKey(level, text);
    const occurrence = occurrences.get(key) ?? 0;
    const id = headingIds.get(key)?.[occurrence];
    occurrences.set(key, occurrence + 1);
    if (!id) return uniqueFallback(text);
    assignedIds.add(id);
    return id;
  };
}

function localizedLabels(locale: Locale) {
  return locale === 'zh-CN'
    ? {
        headingLink: (text: string) => `${text} 的固定链接`,
        table: '数据表格，可横向滚动查看所有列',
      }
    : {
        headingLink: (text: string) => `Permalink to ${text}`,
        table: 'Data table, scroll horizontally to view all columns',
      };
}

export function createMdxComponents({
  locale,
  headings,
}: {
  locale: Locale;
  headings: DocumentHeading[];
}) {
  const labels = localizedLabels(locale);
  const resolveHeadingId = headingIdResolver(headings);

  function Heading({
    level,
    children,
    className,
    id: providedId,
    ...props
  }: ComponentProps<'h1'> & { level: 1 | 2 | 3 }) {
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
    const text = textContent(children).trim();
    const id = providedId || resolveHeadingId(level, text);

    return (
      <Tag className={cn('group relative', className)} id={id} {...props}>
        {children}
        <a
          href={`#${id}`}
          className="ml-1 inline-flex size-11 align-middle items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground sm:size-8 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 motion-reduce:transition-none"
          aria-label={labels.headingLink(text)}
          data-heading-permalink
        >
          <Link2 aria-hidden="true" size={16} />
        </a>
      </Tag>
    );
  }

  // Keyboard users need to focus the overflow region to scroll wide tables.
  /* oxlint-disable jsx-a11y/no-noninteractive-tabindex */
  function Table({ className, ...props }: ComponentProps<'table'>) {
    return (
      <div
        className="my-7 w-full overflow-x-auto rounded-md border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        role="region"
        aria-label={labels.table}
        tabIndex={0}
      >
        <table
          className={cn(
            'w-full border-collapse text-sm [&_td]:min-w-32 [&_td]:border-b [&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:text-foreground [&_th]:min-w-32 [&_th]:border-b [&_th]:border-border [&_th]:bg-muted [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:align-top [&_th]:text-xs [&_th]:font-semibold [&_th]:text-foreground [&_tr:last-child_td]:border-b-0',
            className,
          )}
          {...props}
        />
      </div>
    );
  }
  /* oxlint-enable jsx-a11y/no-noninteractive-tabindex */

  return {
    a: Anchor,
    pre: (props: ComponentProps<'pre'>) => <CodeBlock locale={locale} {...props} />,
    h1: (props: ComponentProps<'h1'>) => <Heading level={1} {...props} />,
    h2: (props: ComponentProps<'h2'>) => <Heading level={2} {...props} />,
    h3: (props: ComponentProps<'h3'>) => <Heading level={3} {...props} />,
    table: Table,
    PackageMetrics: () => <PackageMetrics locale={locale} />,
  };
}
