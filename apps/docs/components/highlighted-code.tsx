import { codeToHtml } from 'shiki';
import { CodeBlockFrame } from './code-block-frame';

export async function HighlightedCode({
  code,
  language,
  filename,
  expandable,
  defaultOpen,
}: {
  code: string;
  language: string;
  filename?: string;
  expandable?: boolean;
  defaultOpen?: boolean;
}) {
  const html = await codeToHtml(code, {
    lang: language,
    themes: { light: 'github-light-default', dark: 'github-dark-default' },
    defaultColor: false,
  });
  return (
    <CodeBlockFrame
      code={code}
      language={language}
      filename={filename}
      expandable={expandable}
      defaultOpen={defaultOpen}
    >
      <div className="highlighted-source" dangerouslySetInnerHTML={{ __html: html }} />
    </CodeBlockFrame>
  );
}
