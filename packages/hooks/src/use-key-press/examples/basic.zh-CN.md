# use-key-press

`useKeyPress` 支持按键、候选列表、谓词、旧式键码和修饰键组合。将监听器限定到 ref，可以让快捷键只在草稿输入框内生效。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useKeyPress } from 'better-hooks/use-key-press';

export function DraftShortcuts() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('季度更新');
  const [action, setAction] = useState('尚未使用快捷键');

  useKeyPress(
    ['ctrl+s', 'meta+s'],
    (event) => {
      event.preventDefault();
      setAction(`已保存：${draft || '空草稿'}`);
    },
    { ref: inputRef, exactMatch: true },
  );

  useKeyPress(
    'Escape',
    () => {
      setDraft('');
      setAction('草稿已清空');
    },
    { ref: inputRef },
  );

  return (
    <div>
      <label>
        支持 Ctrl/Cmd+S 和 Escape 的草稿
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
        />
      </label>
      <output aria-live="polite">{action}</output>
    </div>
  );
}
```

## 行为说明

数组表示彼此独立的候选项，因此修饰键组合必须写成 `ctrl+s` 这样的单个字符串。过滤器和处理函数始终使用最近提交的值。目标、事件列表、精确匹配、捕获或启用状态变化时会协调原生监听器，卸载时则全部移除。
