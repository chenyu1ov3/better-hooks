import { isValidElement, type ComponentProps, type ReactNode } from 'react';
import type { Locale } from '../lib/i18n';
import { CodeBlockFrame } from './code-block-frame';

type PrettyCodePreProps = ComponentProps<'pre'> & {
  readonly 'data-language'?: string;
  readonly 'data-title'?: string;
};

type PrettyCodeChildProps = {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly 'data-language'?: string;
};

function codeText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(codeText).join('');
  if (isValidElement<{ children?: ReactNode }>(children)) return codeText(children.props.children);
  return '';
}

export function CodeBlock({
  children,
  locale = 'en',
  ...props
}: PrettyCodePreProps & { locale?: Locale }) {
  const code = codeText(children).replace(/\n$/, '');
  const codeElement = isValidElement<PrettyCodeChildProps>(children) ? children : null;
  const language =
    props['data-language'] ??
    codeElement?.props['data-language'] ??
    codeElement?.props.className?.match(/language-([\w-]+)/)?.[1] ??
    'text';
  const filename = props['data-title'];

  return (
    <CodeBlockFrame
      code={code}
      language={language}
      filename={filename}
      locale={locale}
      expandable={code.split('\n').length > 14}
      withinFigure
    >
      <pre {...props}>{children}</pre>
    </CodeBlockFrame>
  );
}
