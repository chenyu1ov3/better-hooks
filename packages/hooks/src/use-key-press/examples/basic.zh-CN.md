# use-key-press

`useKeyPress` 监听键盘事件，支持按键名称、旧版数字 keyCode、备选数组、谓词和
修饰键组合。

## 示例

```tsx
'use client';

import { useKeyPress } from 'better-hooks/use-key-press';

export function Shortcuts() {
  useKeyPress('ctrl.s', (event) => {
    event.preventDefault();
    console.log('保存');
  });
  return null;
}
```

## 行为说明

筛选器和处理函数始终使用最近一次已提交的版本；目标、事件列表或捕获模式变化时会替换原生监听器。

可以通过 `target` 或 `ref` 限定监听范围，用 `enabled` 暂停监听，并在需要时使用
`capture` 捕获阶段。回调异常会先通知 `onError`，然后继续抛出。
