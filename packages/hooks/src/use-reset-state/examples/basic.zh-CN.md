# use-reset-state

`useResetState` 返回普通状态以及一个引用稳定的操作，用于恢复首次初始化时解析出的值。

## 示例

```tsx
'use client';

import { useResetState } from 'better-hooks/use-reset-state';

export function ResettableDraft() {
  const [draft, setDraft, resetDraft] = useResetState({ title: '发布说明', priority: 1 });

  return (
    <div>
      <label>
        标题
        <input
          value={draft.title}
          onChange={(event) =>
            setDraft((value) => ({ ...value, title: event.currentTarget.value }))
          }
        />
      </label>
      <label>
        优先级
        <input
          type="range"
          min="1"
          max="5"
          value={draft.priority}
          onChange={(event) =>
            setDraft((value) => ({ ...value, priority: event.currentTarget.valueAsNumber }))
          }
        />
      </label>
      <button type="button" onClick={resetDraft}>
        重置草稿
      </button>
      <output>
        {draft.title || '无标题'} · P{draft.priority}
      </output>
    </div>
  );
}
```

## 行为说明

初始化器只解析一次；即使后续渲染收到不同的初始化器，重置操作仍会恢复首次快照。重置函数和受卸载保护的状态 setter 在渲染之间都保持稳定。
