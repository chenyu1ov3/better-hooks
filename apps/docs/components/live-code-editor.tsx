'use client';

import { Code2, ExternalLink, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { LiveContext, LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { CopyButton } from './copy-button';
import styles from './live-code-editor.module.css';
import {
  isLazyLiveCodeModule,
  lazyLiveCodeModuleSpecifiers,
  loadLiveCodeModule,
} from './live-code-module-loaders';

export type LiveCodeEditorVariant = 'embedded' | 'playground';

export type LiveCodeEditorProps = {
  readonly code?: string;
  readonly defaultSourceOpen?: boolean;
  readonly initialCode: string;
  readonly locale: Locale;
  readonly name: string;
  readonly onCodeChange?: (code: string) => void;
  readonly sourceUrl: string;
  readonly variant?: LiveCodeEditorVariant;
};

const modules: Record<string, object> = {
  react: { ...React, default: React },
};
const supportedModules = new Set<string>(['react', ...lazyLiveCodeModuleSpecifiers()]);
const liveScope = { __modules: modules };
const liveCodeTheme: NonNullable<React.ComponentProps<typeof LiveProvider>['theme']> = {
  plain: {
    backgroundColor: 'transparent',
    color: 'var(--live-code-foreground)',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: 'var(--live-code-comment)', fontStyle: 'italic' },
    },
    {
      types: ['punctuation', 'operator'],
      style: { color: 'var(--live-code-punctuation)' },
    },
    {
      types: ['keyword', 'atrule'],
      style: { color: 'var(--live-code-keyword)' },
    },
    {
      types: ['function', 'class-name'],
      style: { color: 'var(--live-code-function)' },
    },
    {
      types: ['string', 'char', 'builtin', 'inserted', 'attr-value'],
      style: { color: 'var(--live-code-string)' },
    },
    {
      types: ['number', 'boolean', 'constant', 'symbol', 'regex', 'variable'],
      style: { color: 'var(--live-code-number)' },
    },
    {
      types: ['tag', 'deleted'],
      style: { color: 'var(--live-code-tag)' },
    },
    {
      types: ['attr-name', 'property', 'selector'],
      style: { color: 'var(--live-code-attribute)' },
    },
  ],
};

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
      `Unsupported import "${specifier}". Use react, better-hooks, or a public better-hooks subpath.`,
  },
  'zh-CN': {
    componentCase: '导出的组件名必须以大写字母开头。',
    exportCount: '示例必须且只能导出一个具名函数组件。',
    extraExport: '除示例组件外，不能再导出其他内容。',
    exportName: (name: string, specifier: string) => `模块“${specifier}”没有导出“${name}”。`,
    importClause: (clause: string) => `暂不支持这种导入写法：${clause}`,
    importSyntax: '暂不支持这种 import 写法，请使用静态 ES 模块导入。',
    module: (specifier: string) =>
      `不支持导入“${specifier}”。这里只能使用 react、better-hooks 或其公开子路径。`,
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

  return <LiveEditor className={styles.editor} onChange={update} tabMode="focus" />;
}

export default function LiveCodeEditor({
  code: controlledCode,
  defaultSourceOpen = false,
  initialCode,
  locale,
  name,
  onCodeChange,
  sourceUrl,
  variant = 'embedded',
}: LiveCodeEditorProps) {
  const dictionary = dictionaryFor(locale);
  const [localCode, setLocalCode] = useState(initialCode);
  const [sourceOpen, setSourceOpen] = useState(defaultSourceOpen);
  const previewId = useId();
  const sourceId = useId();
  const sourceHeadingId = useId();
  const sourceRef = useRef<HTMLElement>(null);
  const code = controlledCode ?? localCode;
  const transformCode = useMemo(() => createLiveCodeTransformer(locale), [locale]);
  const labels =
    locale === 'en'
      ? {
          code: 'Editable TSX',
          codeTab: 'Code',
          hideSource: 'Hide code',
          preview: `${name} preview`,
          previewTab: 'Preview',
          reset: 'Reset example',
          showSource: 'Edit code',
          views: 'Playground view',
        }
      : {
          code: '可编辑 TSX',
          codeTab: '代码',
          hideSource: '收起代码',
          preview: `${name} 预览`,
          previewTab: '预览',
          reset: '重置示例',
          showSource: '编辑代码',
          views: '演练场视图',
        };

  useEffect(() => {
    const editor = sourceRef.current?.querySelector('pre');
    if (!editor) return;
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-label', labels.code);
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('tabindex', '0');
  }, [labels.code, sourceOpen, variant]);

  function updateCode(nextCode: string) {
    if (controlledCode === undefined) setLocalCode(nextCode);
    onCodeChange?.(nextCode);
  }

  const sourcePanel = (
    <section
      ref={sourceRef}
      className="live-code-source flex! h-full! w-full! min-h-0! max-h-none! min-w-0! flex-1! flex-col! overflow-hidden! border-0! bg-[var(--code-background)]! text-[var(--code-foreground)]!"
      id={sourceId}
      aria-labelledby={sourceHeadingId}
    >
      <div
        className="live-code-panel-heading flex! min-h-10! shrink-0 items-center border-b! border-[var(--code-border)]! bg-[var(--code-header)]! px-4! font-mono text-xs! font-semibold! text-[var(--code-muted)]!"
        id={sourceHeadingId}
      >
        {labels.code}
      </div>
      <div className="live-code-source__editor min-h-0! flex-1 overflow-auto">
        <LiveCodeInput onChange={updateCode} />
      </div>
    </section>
  );
  const previewPanel = (
    <section
      className="live-code-preview flex! h-full! w-full! min-h-0! min-w-0! flex-1! flex-col! overflow-hidden! bg-background!"
      aria-labelledby={previewId}
    >
      <div
        className="live-code-panel-heading flex! min-h-10! shrink-0 items-center border-b! border-border! bg-muted! px-4! font-mono text-xs! font-semibold! text-muted-foreground!"
        id={previewId}
      >
        {labels.preview}
      </div>
      <LivePreview
        className={cn(
          'live-code-preview__canvas grid! w-full! min-h-0! flex-1! content-center gap-4 overflow-auto! p-5! sm:p-6!',
          '[&>div]:flex [&>div]:min-w-0 [&>div]:flex-wrap [&>div]:items-center [&>div]:gap-2.5',
          '[&_label]:grid [&_label]:min-w-[min(100%,230px)] [&_label]:gap-2 [&_label]:text-xs [&_label]:font-medium [&_label]:text-muted-foreground',
          '[&_input:not([type=range])]:min-h-11 [&_input:not([type=range])]:w-full [&_input:not([type=range])]:rounded-md [&_input:not([type=range])]:border [&_input:not([type=range])]:border-border [&_input:not([type=range])]:bg-background [&_input:not([type=range])]:px-3 [&_input:not([type=range])]:outline-none [&_input:not([type=range])]:focus-visible:border-ring [&_input:not([type=range])]:focus-visible:ring-2 [&_input:not([type=range])]:focus-visible:ring-ring/30',
          '[&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:p-3 [&_textarea]:outline-none [&_textarea]:focus-visible:border-ring [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-ring/30',
          '[&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-background [&_select]:px-3 [&_select]:outline-none [&_select]:focus-visible:border-ring [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-ring/30',
          '[&_input[type=range]]:w-full [&_input[type=range]]:max-w-80 [&_input[type=range]]:accent-foreground',
          '[&_button]:min-h-11 [&_button]:rounded-md [&_button]:border [&_button]:border-border [&_button]:bg-muted [&_button]:px-3 [&_button]:text-xs [&_button]:font-medium [&_button]:outline-none [&_button]:transition-[color,background-color,border-color,box-shadow] [&_button]:hover:border-border-strong [&_button]:hover:bg-background [&_button]:hover:text-foreground [&_button]:focus-visible:border-ring [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-ring/30 [&_button]:disabled:pointer-events-none [&_button]:disabled:opacity-50',
          '[&_output]:flex [&_output]:min-h-11 [&_output]:min-w-[min(100%,180px)] [&_output]:items-center [&_output]:border-l-[3px] [&_output]:border-foreground [&_output]:bg-muted [&_output]:px-3 [&_output]:py-2 [&_output]:font-mono [&_output]:text-xs [&_output]:wrap-anywhere',
        )}
      />
    </section>
  );
  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      <CopyButton
        className="size-11 sm:size-9"
        value={code}
        label={dictionary.actions.copy}
        copiedLabel={dictionary.actions.copied}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-11 sm:size-9"
            disabled={code === initialCode}
            aria-label={labels.reset}
            onClick={() => updateCode(initialCode)}
          >
            <RotateCcw aria-hidden="true" size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{labels.reset}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon-sm" className="size-11 sm:size-9">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={dictionary.actions.viewSource}
            >
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{dictionary.actions.viewSource}</TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <LiveProvider
      code={code}
      enableTypeScript
      language="tsx"
      noInline
      scope={liveScope}
      theme={liveCodeTheme}
      transformCode={transformCode}
    >
      <div
        className={cn(
          'live-code-workbench flex! min-w-0! flex-col! overflow-hidden! border! border-border! bg-background!',
          styles.theme,
          variant === 'playground'
            ? 'rounded-t-none! rounded-b-md! border-t-0! lg:h-[560px]!'
            : 'rounded-md!',
        )}
        data-variant={variant}
      >
        <div className="flex min-h-[54px] shrink-0 items-center justify-between gap-3 border-b border-border bg-muted px-2.5 sm:px-3">
          {variant === 'embedded' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-controls={sourceId}
              aria-expanded={sourceOpen}
              className="min-h-11 px-3 sm:min-h-9"
              onClick={() => setSourceOpen((open) => !open)}
            >
              <Code2 aria-hidden="true" size={16} />
              {sourceOpen ? labels.hideSource : labels.showSource}
            </Button>
          ) : (
            <span className="flex min-w-0 items-center gap-2 px-2 font-mono text-xs font-medium text-muted-foreground">
              <Code2 className="shrink-0" aria-hidden="true" size={16} />
              <span className="truncate">{name}</span>
            </span>
          )}
          {actions}
        </div>

        {variant === 'playground' ? (
          <Tabs defaultValue="code" className="min-h-0 flex-1 gap-0">
            <TabsList
              className="mx-3 my-2 grid w-[calc(100%-1.5rem)] shrink-0 grid-cols-2 lg:hidden"
              aria-label={labels.views}
            >
              <TabsTrigger value="code">{labels.codeTab}</TabsTrigger>
              <TabsTrigger value="preview">{labels.previewTab}</TabsTrigger>
            </TabsList>
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
              <TabsContent
                className={cn(
                  'm-0 flex overflow-hidden border-t border-[var(--code-border)] data-[state=inactive]:hidden lg:min-h-0 lg:border-t-0 lg:border-r lg:data-[state=inactive]:flex',
                  styles.sourceViewport,
                )}
                forceMount
                value="code"
              >
                {sourcePanel}
              </TabsContent>
              <TabsContent
                className={cn(
                  'm-0 flex overflow-hidden border-t border-border data-[state=inactive]:hidden lg:min-h-0 lg:border-t-0 lg:data-[state=inactive]:flex',
                  styles.previewViewport,
                )}
                forceMount
                value="preview"
              >
                {previewPanel}
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div
            className={cn(
              'grid min-w-0 grid-cols-1',
              sourceOpen
                ? 'lg:h-[420px] lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]'
                : 'h-[320px] sm:h-[360px]',
            )}
          >
            {sourceOpen ? (
              <div
                className={cn(
                  'min-w-0 overflow-hidden border-b border-[var(--code-border)] lg:h-full lg:border-r lg:border-b-0',
                  styles.sourceViewport,
                )}
              >
                {sourcePanel}
              </div>
            ) : null}
            <div
              className={cn(
                'min-w-0 overflow-hidden',
                sourceOpen ? cn(styles.previewViewport, 'lg:h-full') : 'h-full',
              )}
            >
              {previewPanel}
            </div>
          </div>
        )}

        <LiveError
          className="live-code-error m-0! max-h-36 shrink-0 overflow-auto border-x-0! border-t! border-b-0! border-destructive/40! bg-destructive/10! p-3.5! font-mono text-xs! leading-relaxed! whitespace-pre-wrap text-destructive!"
          role="alert"
        />
      </div>
    </LiveProvider>
  );
}
