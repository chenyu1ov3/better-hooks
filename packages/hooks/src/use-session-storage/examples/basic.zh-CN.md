# use-session-storage

`useSessionStorage` 会让类型安全的值与当前浏览器标签页的存储保持同步，适合草稿和临时流程状态。

## 示例

```tsx
'use client';

import { useSessionStorage } from 'better-hooks/use-session-storage';

export function DraftField() {
  const draft = useSessionStorage('draft:v1', '');

  return (
    <div>
      <textarea
        aria-label="临时草稿"
        value={draft.value}
        onChange={(event) => draft.setValue(event.currentTarget.value)}
      />
      <button type="button" onClick={draft.remove}>
        丢弃草稿
      </button>
      {draft.error ? <output>无法保存草稿</output> : null}
    </div>
  );
}
```

## 行为说明

API 与 `useLocalStorage` 一致，但数据存放在 `sessionStorage` 中。删除存储项会恢复初始值，服务端渲染也使用这份初始快照。
