'use client';

import { useDebounce } from 'better-hooks/use-debounce';
import { useId, useState } from 'react';
import type { Locale } from '../lib/i18n';
import styles from './hook-runtime-demo.module.css';

const debounceDelay = 400;

const runtimeCopy = {
  en: {
    title: 'Hook runtime',
    inputLabel: 'Try a value',
    inputStage: 'Raw input',
    waitingStage: 'Wait 400ms',
    publishedStage: 'Published',
    waiting: 'Waiting for changes to settle',
    settled: 'Changes settled',
    publishedLabel: 'Published value',
    empty: 'Empty',
    flowLabel: 'Debounced value stages',
    initialValue: 'search hooks',
  },
  'zh-CN': {
    title: 'Hook 运行时',
    inputLabel: '输入内容',
    inputStage: '原始输入',
    waitingStage: '等待 400ms',
    publishedStage: '已发布',
    waiting: '正在等待输入稳定',
    settled: '输入已稳定',
    publishedLabel: '已发布的值',
    empty: '空值',
    flowLabel: '防抖值处理阶段',
    initialValue: '搜索 Hook',
  },
} as const;

export function HookRuntimeDemo({ locale }: { locale: Locale }) {
  const copy = runtimeCopy[locale];
  const inputId = useId();
  const titleId = useId();
  const [value, setValue] = useState<string>(copy.initialValue);
  const [cycle, setCycle] = useState(0);
  const publishedValue = useDebounce(value, { delay: debounceDelay });
  const isWaiting = value !== publishedValue;

  return (
    <figure
      className="m-0 w-full overflow-hidden rounded-md border border-border bg-card shadow-sm"
      data-testid="hook-lifecycle-visual"
      aria-labelledby={titleId}
    >
      <figcaption className="flex min-h-11 items-center justify-between gap-4 border-b border-border px-4 py-2.5 sm:px-5">
        <span
          id={titleId}
          className="shrink-0 text-xs font-bold whitespace-nowrap text-foreground uppercase"
        >
          {copy.title}
        </span>
        <code className={`${styles.mono} min-w-0 truncate text-xs text-muted-foreground`}>
          useDebounce(value, &#123; delay: 400 &#125;)
        </code>
      </figcaption>

      <div className="p-4 sm:p-5">
        <label htmlFor={inputId} className="mb-2 block text-xs font-semibold text-foreground">
          {copy.inputLabel}
        </label>
        <input
          id={inputId}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setCycle((currentCycle) => currentCycle + 1);
          }}
          autoComplete="off"
          spellCheck={false}
        />

        <ol
          className="mt-5 grid list-none overflow-hidden rounded-md border border-border bg-background p-0 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)]"
          aria-label={copy.flowLabel}
        >
          <li className={`${styles.stage} min-w-0 p-4`} data-active="true">
            <span className="block text-xs font-semibold text-muted-foreground">
              01 / {copy.inputStage}
            </span>
            <span
              className={`${styles.mono} mt-3 block min-h-6 text-sm font-semibold break-words text-foreground [overflow-wrap:anywhere]`}
            >
              {value || copy.empty}
            </span>
          </li>

          <li
            className={`${styles.stage} min-w-0 border-t border-border p-4 md:border-t-0 md:border-l`}
            data-active={isWaiting}
          >
            <span className="block text-xs font-semibold text-muted-foreground">
              02 / {copy.waitingStage}
            </span>
            <span
              className="mt-3 flex min-h-6 items-center gap-2 text-xs font-semibold text-foreground"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${
                  isWaiting ? 'bg-[var(--signal-warning)]' : 'bg-muted-foreground'
                }`}
                aria-hidden="true"
              />
              {isWaiting ? copy.waiting : copy.settled}
            </span>
            <span className="mt-3 block h-0.5 overflow-hidden bg-border" aria-hidden="true">
              <span
                key={cycle}
                className={`${styles.progress} ${
                  isWaiting ? styles.progressActive : styles.progressSettled
                } block h-full bg-[var(--signal-warning)]`}
              />
            </span>
          </li>

          <li
            className={`${styles.stage} min-w-0 border-t border-border p-4 md:border-t-0 md:border-l`}
            data-active={!isWaiting}
          >
            <span className="block text-xs font-semibold text-muted-foreground">
              03 / {copy.publishedStage}
            </span>
            <output
              className={`${styles.mono} mt-3 block min-h-6 text-sm font-semibold break-words text-[var(--signal-success)] [overflow-wrap:anywhere]`}
              aria-label={copy.publishedLabel}
              aria-live="polite"
              aria-atomic="true"
            >
              {publishedValue || copy.empty}
            </output>
          </li>
        </ol>
      </div>
    </figure>
  );
}
