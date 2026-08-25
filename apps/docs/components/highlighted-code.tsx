import { Fragment, type CSSProperties } from 'react';
import { codeToHtml, codeToTokens, type BundledLanguage, type SpecialLanguage } from 'shiki';
import type { Locale } from '../lib/i18n';
import styles from './code-block.module.css';
import { SHIKI_THEMES } from './code-block-config';
import { CodeBlockFrame } from './code-block-frame';

export async function HighlightedCode({
  code,
  language,
  filename,
  locale = 'en',
  expandable,
  defaultOpen,
}: {
  code: string;
  language: string;
  filename?: string;
  locale?: Locale;
  expandable?: boolean;
  defaultOpen?: boolean;
}) {
  const html = await codeToHtml(code, {
    lang: language,
    themes: SHIKI_THEMES,
    defaultColor: false,
  });
  return (
    <CodeBlockFrame
      code={code}
      language={language}
      filename={filename}
      locale={locale}
      expandable={expandable}
      defaultOpen={defaultOpen}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </CodeBlockFrame>
  );
}

export async function HighlightedCommand({
  code,
  language = 'sh',
}: {
  code: string;
  language?: BundledLanguage | SpecialLanguage;
}) {
  const { tokens } = await codeToTokens(code, {
    lang: language,
    themes: SHIKI_THEMES,
    defaultColor: false,
  });

  return (
    <code
      className="min-w-0 overflow-hidden px-3 text-xs text-ellipsis whitespace-nowrap text-foreground"
      data-highlighted-command=""
    >
      {tokens.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? '\n' : null}
          {line.map((token, tokenIndex) => (
            <span
              className={styles.inlineToken}
              key={`${token.offset}-${tokenIndex}`}
              style={token.htmlStyle as CSSProperties}
            >
              {token.content}
            </span>
          ))}
        </Fragment>
      ))}
    </code>
  );
}
