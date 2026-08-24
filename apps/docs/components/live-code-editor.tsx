'use client';

import { Code2, ExternalLink, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { LiveContext, LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { CopyButton } from './copy-button';
import {
  isLazyLiveCodeModule,
  lazyLiveCodeModuleSpecifiers,
  loadLiveCodeModule,
} from './live-code-module-loaders';

export type LiveCodeEditorProps = {
  readonly code?: string;
  readonly defaultSourceOpen?: boolean;
  readonly initialCode: string;
  readonly locale: Locale;
  readonly name: string;
  readonly onCodeChange?: (code: string) => void;
  readonly sourceUrl: string;
};

const modules: Record<string, object> = {
  react: { ...React, default: React },
};
const supportedModules = new Set<string>(['react', ...lazyLiveCodeModuleSpecifiers()]);
const liveScope = { __modules: modules };

const errorCopy = {
  en: {
    componentCase: 'The exported component name must start with an uppercase letter.',
    exportCount: 'The example must export exactly one named function component.',
    extraExport: 'Only the example component may be exported.',
    exportName: (name: string, specifier: string) =>
      `Module "${specifier}" does not export "${name}".`,
    importClause: (clause: string) => `Unsupported import clause: ${clause}`,
    importSyntax: 'Unsupported import syntax. Use static ES module imports.',
    module: (specifier: string) =>
      `Unsupported import "${specifier}". Use react, better-hook, or a public better-hook subpath.`,
  },
  'zh-CN': {
    componentCase: '导出的组件名必须以大写字母开头。',
    exportCount: '示例必须且只能导出一个具名函数组件。',
    extraExport: '除示例组件外，不能再导出其他内容。',
    exportName: (name: string, specifier: string) => `模块“${specifier}”没有导出“${name}”。`,
    importClause: (clause: string) => `暂不支持这种导入写法：${clause}`,
    importSyntax: '暂不支持这种 import 写法，请使用静态 ES 模块导入。',
    module: (specifier: string) =>
      `不支持导入“${specifier}”。这里只能使用 react、better-hook 或其公开子路径。`,
  },
} as const;

const importPattern = /^[\t ]*import[\t ]+([\s\S]*?)[\t ]+from[\t ]+(['"])([^'"\r\n]+)\2[\t ]*;?/gm;
const exportedFunctionPattern = /\bexport\s+(?:default\s+)?function\s+([A-Za-z_$][\w$]*)/g;

function rewriteNamedImports(
  clause: string,
  moduleVariable: string,
  moduleExports: object,
  specifier: string,
  messages: (typeof errorCopy)[Locale],
): string {
  const bindings = clause
    .trim()
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .split(',')
    .map((binding) => binding.trim())
    .filter((binding) => binding && !binding.startsWith('type '))
    .map((binding) => {
      const [imported, local] = binding.split(/\s+as\s+/);
      const importedName = imported.trim();
      if (!Object.hasOwn(moduleExports, importedName)) {
        throw new SyntaxError(messages.exportName(importedName, specifier));
      }
      return local ? `${importedName}: ${local.trim()}` : importedName;
    });

  return bindings.length > 0 ? `const { ${bindings.join(', ')} } = ${moduleVariable};` : '';
}

function rewriteImportClause(
  clause: string,
  moduleVariable: string,
  moduleExports: object,
  specifier: string,
  messages: (typeof errorCopy)[Locale],
): string {
  const valueClause = clause.trim();
  if (valueClause.startsWith('type ')) return '';
  if (valueClause.startsWith('{')) {
    return rewriteNamedImports(valueClause, moduleVariable, moduleExports, specifier, messages);
  }
  if (valueClause.startsWith('*')) {
    const match = valueClause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (!match) throw new SyntaxError(messages.importClause(valueClause));
    return `const ${match[1]} = ${moduleVariable};`;
  }

  const comma = valueClause.indexOf(',');
  const defaultBinding = (comma === -1 ? valueClause : valueClause.slice(0, comma)).trim();
  if (!/^[A-Za-z_$][\w$]*$/.test(defaultBinding)) {
    throw new SyntaxError(messages.importClause(valueClause));
  }

  if (!Object.hasOwn(moduleExports, 'default')) {
    throw new SyntaxError(messages.exportName('default', specifier));
  }
  const statements = [`const ${defaultBinding} = ${moduleVariable}.default;`];
  if (comma !== -1) {
    const remainder = valueClause.slice(comma + 1).trim();
    if (remainder.startsWith('{')) {
      statements.push(
        rewriteNamedImports(remainder, moduleVariable, moduleExports, specifier, messages),
      );
    } else if (remainder.startsWith('*')) {
      const match = remainder.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
      if (!match) throw new SyntaxError(messages.importClause(valueClause));
      statements.push(`const ${match[1]} = ${moduleVariable};`);
    } else {
      throw new SyntaxError(messages.importClause(valueClause));
    }
  }
  return statements.filter(Boolean).join('\n');
}

function importedModuleSpecifiers(source: string): readonly string[] {
  return [...source.matchAll(importPattern)].map((match) => match[3]);
}

async function loadImportedModules(source: string): Promise<void> {
  const specifiers = new Set(importedModuleSpecifiers(source).filter(isLazyLiveCodeModule));
  await Promise.all(
    [...specifiers].map(async (specifier) => {
      modules[specifier] = await loadLiveCodeModule(specifier);
    }),
  );
}

function prepareLiveCode(source: string, locale: Locale): string {
  const messages = errorCopy[locale];
  let moduleIndex = 0;
  let code = source.replace(/^[\t ]*(['"])use client\1;?[\t ]*(?:\r?\n)?/, '');
  code = code.replace(importPattern, (_statement, clause: string, _quote, specifier: string) => {
    if (!supportedModules.has(specifier)) {
      throw new SyntaxError(messages.module(specifier));
    }
    const moduleVariable = `__module${moduleIndex++}`;
    const moduleExports = modules[specifier];
    if (!moduleExports) throw new SyntaxError(messages.module(specifier));
    return `const ${moduleVariable} = __modules[${JSON.stringify(specifier)}];\n${rewriteImportClause(clause, moduleVariable, moduleExports, specifier, messages)}`;
  });

  if (/^[\t ]*import\b/m.test(code)) {
    throw new SyntaxError(messages.importSyntax);
  }

  const exportedFunctions = [...code.matchAll(exportedFunctionPattern)];
  if (exportedFunctions.length !== 1) {
    throw new SyntaxError(messages.exportCount);
  }
  const componentName = exportedFunctions[0]?.[1];
  if (!componentName || !/^[A-Z]/.test(componentName)) {
    throw new SyntaxError(messages.componentCase);
  }

  code = code.replace(exportedFunctionPattern, `function ${componentName}`);
  if (/\bexport\b/.test(code)) {
    throw new SyntaxError(messages.extraExport);
  }

  return `${code.trim()}\n\nrender(<${componentName} />);`;
}

function createLiveCodeTransformer(locale: Locale): (source: string) => Promise<string> {
  let latestSource = '';

  return async (source: string) => {
    latestSource = source;
    let requestedSource = source;
    do {
      requestedSource = latestSource;
      await loadImportedModules(requestedSource);
    } while (requestedSource !== latestSource);
    return prepareLiveCode(requestedSource, locale);
  };
}

function LiveCodeInput({ onChange }: { readonly onChange: (code: string) => void }) {
  const live = useContext(LiveContext);

  function update(nextCode: string) {
    live.onChange(nextCode);
    onChange(nextCode);
  }

  return <LiveEditor onChange={update} tabMode="focus" />;
}

export default function LiveCodeEditor({
  code: controlledCode,
  defaultSourceOpen = false,
  initialCode,
  locale,
  name,
  onCodeChange,
  sourceUrl,
}: LiveCodeEditorProps) {
  const dictionary = dictionaryFor(locale);
  const [localCode, setLocalCode] = useState(initialCode);
  const [sourceOpen, setSourceOpen] = useState(defaultSourceOpen);
  const previewId = useId();
  const sourceId = useId();
  const sourceRef = useRef<HTMLElement>(null);
  const code = controlledCode ?? localCode;
  const transformCode = useMemo(() => createLiveCodeTransformer(locale), [locale]);
  const labels =
    locale === 'en'
      ? {
          code: 'Editable TSX',
          hideSource: 'Hide code',
          preview: `${name} preview`,
          reset: 'Reset example',
          showSource: 'Edit code',
        }
      : {
          code: '可编辑 TSX',
          hideSource: '收起代码',
          preview: `${name} 预览`,
          reset: '重置示例',
          showSource: '编辑代码',
        };

  useEffect(() => {
    const editor = sourceRef.current?.querySelector('pre');
    if (!editor) return;
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-label', labels.code);
    editor.setAttribute('aria-multiline', 'true');
  }, [labels.code, sourceOpen]);

  function updateCode(nextCode: string) {
    if (controlledCode === undefined) setLocalCode(nextCode);
    onCodeChange?.(nextCode);
  }

  return (
    <LiveProvider
      code={code}
      enableTypeScript
      language="tsx"
      noInline
      scope={liveScope}
      transformCode={transformCode}
    >
      <div className="live-code-workbench">
        <div className="live-code-toolbar">
          <button
            type="button"
            aria-controls={sourceId}
            aria-expanded={sourceOpen}
            className="live-code-action"
            onClick={() => setSourceOpen((open) => !open)}
          >
            <Code2 aria-hidden="true" size={15} />
            {sourceOpen ? labels.hideSource : labels.showSource}
          </button>
          <div className="live-code-toolbar__actions">
            <CopyButton
              className="live-code-icon-action"
              value={code}
              label={dictionary.actions.copy}
              copiedLabel={dictionary.actions.copied}
            />
            <button
              type="button"
              className="live-code-icon-action"
              disabled={code === initialCode}
              aria-label={labels.reset}
              title={labels.reset}
              onClick={() => updateCode(initialCode)}
            >
              <RotateCcw aria-hidden="true" size={15} />
            </button>
            <a
              className="live-code-icon-action"
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={dictionary.actions.viewSource}
              title={dictionary.actions.viewSource}
            >
              <ExternalLink aria-hidden="true" size={15} />
            </a>
          </div>
        </div>
        {sourceOpen ? (
          <section
            ref={sourceRef}
            className="live-code-source"
            id={sourceId}
            aria-label={labels.code}
          >
            <LiveCodeInput onChange={updateCode} />
          </section>
        ) : null}
        <section className="live-code-preview" aria-labelledby={previewId}>
          <div className="live-code-panel-heading" id={previewId}>
            {labels.preview}
          </div>
          <LivePreview className="live-code-preview__canvas" />
        </section>
        <LiveError className="live-code-error" role="alert" />
      </div>
    </LiveProvider>
  );
}
