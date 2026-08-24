'use client';

import { Code2, ExternalLink, RotateCcw } from 'lucide-react';
import * as BetterHook from 'better-hook';
import * as UseAsyncModule from 'better-hook/use-async';
import * as UseBooleanModule from 'better-hook/use-boolean';
import * as UseClickOutsideModule from 'better-hook/use-click-outside';
import * as UseControllableStateModule from 'better-hook/use-controllable-state';
import * as UseDebounceModule from 'better-hook/use-debounce';
import * as UseDebounceFnModule from 'better-hook/use-debounce-fn';
import * as UseDocumentVisibilityModule from 'better-hook/use-document-visibility';
import * as UseEventListenerModule from 'better-hook/use-event-listener';
import * as UseHoverModule from 'better-hook/use-hover';
import * as UseInputModule from 'better-hook/use-input';
import * as UseIntervalModule from 'better-hook/use-interval';
import * as UseIsMountedModule from 'better-hook/use-is-mounted';
import * as UseIsomorphicLayoutEffectModule from 'better-hook/use-isomorphic-layout-effect';
import * as UseKeyPressModule from 'better-hook/use-key-press';
import * as UseLatestModule from 'better-hook/use-latest';
import * as UseLockFnModule from 'better-hook/use-lock-fn';
import * as UseLocalStorageModule from 'better-hook/use-local-storage';
import * as UseMemoizedFnModule from 'better-hook/use-memoized-fn';
import * as UseMediaQueryModule from 'better-hook/use-media-query';
import * as UseOnlineModule from 'better-hook/use-online';
import * as UsePreviousModule from 'better-hook/use-previous';
import * as UseResetStateModule from 'better-hook/use-reset-state';
import * as UseSafeStateModule from 'better-hook/use-safe-state';
import * as UseSessionStorageModule from 'better-hook/use-session-storage';
import * as UseStorageModule from 'better-hook/use-storage';
import * as UseThrottleModule from 'better-hook/use-throttle';
import * as UseThrottleFnModule from 'better-hook/use-throttle-fn';
import * as UseTimeoutModule from 'better-hook/use-timeout';
import * as UseToggleModule from 'better-hook/use-toggle';
import * as UseUnmountedRefModule from 'better-hook/use-unmounted-ref';
import * as UseWindowSizeModule from 'better-hook/use-window-size';
import * as React from 'react';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { LiveContext, LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { CopyButton } from './copy-button';

export type LiveCodeEditorProps = {
  readonly code?: string;
  readonly defaultSourceOpen?: boolean;
  readonly initialCode: string;
  readonly locale: Locale;
  readonly name: string;
  readonly onCodeChange?: (code: string) => void;
  readonly sourceUrl: string;
};

const modules = {
  react: { ...React, default: React },
  'better-hook': BetterHook,
  'better-hook/use-async': UseAsyncModule,
  'better-hook/use-boolean': UseBooleanModule,
  'better-hook/use-click-outside': UseClickOutsideModule,
  'better-hook/use-controllable-state': UseControllableStateModule,
  'better-hook/use-debounce': UseDebounceModule,
  'better-hook/use-debounce-fn': UseDebounceFnModule,
  'better-hook/use-document-visibility': UseDocumentVisibilityModule,
  'better-hook/use-event-listener': UseEventListenerModule,
  'better-hook/use-hover': UseHoverModule,
  'better-hook/use-input': UseInputModule,
  'better-hook/use-interval': UseIntervalModule,
  'better-hook/use-is-mounted': UseIsMountedModule,
  'better-hook/use-isomorphic-layout-effect': UseIsomorphicLayoutEffectModule,
  'better-hook/use-key-press': UseKeyPressModule,
  'better-hook/use-latest': UseLatestModule,
  'better-hook/use-lock-fn': UseLockFnModule,
  'better-hook/use-local-storage': UseLocalStorageModule,
  'better-hook/use-memoized-fn': UseMemoizedFnModule,
  'better-hook/use-media-query': UseMediaQueryModule,
  'better-hook/use-online': UseOnlineModule,
  'better-hook/use-previous': UsePreviousModule,
  'better-hook/use-reset-state': UseResetStateModule,
  'better-hook/use-safe-state': UseSafeStateModule,
  'better-hook/use-session-storage': UseSessionStorageModule,
  'better-hook/use-storage': UseStorageModule,
  'better-hook/use-throttle': UseThrottleModule,
  'better-hook/use-throttle-fn': UseThrottleFnModule,
  'better-hook/use-timeout': UseTimeoutModule,
  'better-hook/use-toggle': UseToggleModule,
  'better-hook/use-unmounted-ref': UseUnmountedRefModule,
  'better-hook/use-window-size': UseWindowSizeModule,
} as const;
const supportedModules = new Set<string>(Object.keys(modules));
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

function prepareLiveCode(source: string, locale: Locale): string {
  const messages = errorCopy[locale];
  let moduleIndex = 0;
  let code = source.replace(/^[\t ]*(['"])use client\1;?[\t ]*(?:\r?\n)?/, '');
  code = code.replace(importPattern, (_statement, clause: string, _quote, specifier: string) => {
    if (!supportedModules.has(specifier)) {
      throw new SyntaxError(messages.module(specifier));
    }
    const moduleVariable = `__module${moduleIndex++}`;
    const moduleExports = modules[specifier as keyof typeof modules];
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

const transformLiveCode = {
  en: (source: string) => prepareLiveCode(source, 'en'),
  'zh-CN': (source: string) => prepareLiveCode(source, 'zh-CN'),
} satisfies Record<Locale, (source: string) => string>;

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
      transformCode={transformLiveCode[locale]}
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
