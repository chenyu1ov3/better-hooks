import { slug } from 'github-slugger';
import { isValidElement, type ComponentProps, type ReactNode } from 'react';
import Link from 'next/link';
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

function Heading({ level, children, ...props }: { level: 1 | 2 | 3; children?: ReactNode }) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  const text = textContent(children);
  const id = text ? slug(text) : undefined;
  return (
    <Tag id={id} {...props}>
      {children}
    </Tag>
  );
}

function textContent(value: ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (isValidElement<{ children?: ReactNode }>(value)) return textContent(value.props.children);
  return '';
}

export const mdxComponents = {
  a: Anchor,
  pre: CodeBlock,
  h1: (props: ComponentProps<'h1'>) => <Heading level={1} {...props} />,
  h2: (props: ComponentProps<'h2'>) => <Heading level={2} {...props} />,
  h3: (props: ComponentProps<'h3'>) => <Heading level={3} {...props} />,
  table: (props: ComponentProps<'table'>) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
};
