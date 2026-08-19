import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { CopyButton } from './copy-button';

function CodeBar({
  code,
  language,
  filename,
  expandable,
}: {
  code: string;
  language: string;
  filename?: string;
  expandable?: boolean;
}) {
  const label = <span title={filename}>{filename ?? language}</span>;
  if (expandable) {
    return (
      <>
        <summary className="code-frame__bar">
          {label}
          <ChevronDown className="code-expand" aria-hidden="true" size={16} />
        </summary>
        <CopyButton value={code} className="copy-button code-frame__copy" />
      </>
    );
  }
  return (
    <div className="code-frame__bar">
      {label}
      <CopyButton value={code} />
    </div>
  );
}

export function CodeBlockFrame({
  children,
  code,
  language,
  filename,
  expandable,
  defaultOpen = true,
}: {
  children: ReactNode;
  code: string;
  language: string;
  filename?: string;
  expandable?: boolean;
  defaultOpen?: boolean;
}) {
  if (expandable) {
    return (
      <details className="code-frame code-frame--expandable" open={defaultOpen}>
        <CodeBar code={code} language={language} filename={filename} expandable />
        <div className="code-frame__viewport">{children}</div>
      </details>
    );
  }
  return (
    <div className="code-frame">
      <CodeBar code={code} language={language} filename={filename} />
      <div className="code-frame__viewport">{children}</div>
    </div>
  );
}
