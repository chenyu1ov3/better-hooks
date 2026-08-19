import type { Heading } from '../lib/content';

function TocLinks({ headings, label }: { headings: Heading[]; label: string }) {
  return (
    <nav aria-label={label}>
      {headings.map((heading) => (
        <a
          key={heading.id}
          className={heading.level === 3 ? 'toc-sub' : undefined}
          href={`#${heading.id}`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}

export function TableOfContents({ headings, label }: { headings: Heading[]; label: string }) {
  if (!headings.length) return null;
  return (
    <>
      <details className="toc-mobile">
        <summary>{label}</summary>
        <TocLinks headings={headings} label={label} />
      </details>
      <aside className="toc" aria-label={label}>
        <p className="section-label">{label}</p>
        <TocLinks headings={headings} label={label} />
      </aside>
    </>
  );
}
