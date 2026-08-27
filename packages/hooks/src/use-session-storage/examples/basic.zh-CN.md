# use-session-storage

`useSessionStorage` 将类型化值保存在当前浏览器标签页范围内，适合不应跨新会话保留的临时草稿和流程状态。

## 示例

```tsx
'use client';

import { useSessionStorage } from 'better-hooks/use-session-storage';

export function SessionDraft() {
  const draft = useSessionStorage('better-hooks:draft-example', '');

  return (
    <div>
      <label>
        会话草稿
        <textarea
          value={draft.value}
          onChange={(event) => draft.setValue(event.currentTarget.value)}
        />
      </label>
      <button type="button" disabled={!draft.value} onClick={draft.remove}>
        丢弃草稿
      </button>
      <output aria-live="polite">
        {draft.error === undefined ? `此标签页已存储 ${draft.value.length} 个字符` : '草稿无法存储'}
      </output>
    </div>
  );
}
```

## 行为说明

API 与 `useLocalStorage` 一致，包括函数式更新、自定义编解码器、同键同步和可恢复错误。区别在浏览器作用域：sessionStorage 仅属于当前标签页。SSR 和删除键后都会返回首次捕获的初始值。
