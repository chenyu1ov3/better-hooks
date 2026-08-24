# use-toggle

`useToggle` 是一个紧凑的布尔状态 Hook，并提供稳定的操作函数。该函数可以反转状态、设置明确值或执行函数式更新。

## 示例

```tsx
'use client';

import { useToggle } from 'better-hooks/use-toggle';

export function Disclosure() {
  const [open, toggle] = useToggle(false);

  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => toggle()}>
        {open ? '收起详情' : '展开详情'}
      </button>
      {open ? <p>这里是更多详细信息。</p> : null}
    </div>
  );
}
```

## 行为说明

操作函数在重新渲染之间保持稳定。同一个 React batch 中的多个函数式更新会按顺序基于最新排队值执行。
