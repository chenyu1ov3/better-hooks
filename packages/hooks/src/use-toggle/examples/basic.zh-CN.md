# use-toggle

`useToggle` 是一个紧凑的布尔状态原语，其引用稳定的操作函数可以反转当前值、显式赋值或执行函数式更新。

## 示例

```tsx
'use client';

import { useToggle } from 'better-hooks/use-toggle';

export function ShippingDisclosure() {
  const [open, toggle] = useToggle(false);

  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => toggle()}>
        {open ? '收起配送详情' : '查看配送详情'}
      </button>
      {open ? (
        <div>
          <p>订单通常会在两个工作日内出库。</p>
          <button type="button" onClick={() => toggle(false)}>
            关闭
          </button>
        </div>
      ) : null}
    </div>
  );
}
```

## 行为说明

操作函数的引用在渲染之间保持稳定。无参数调用会反转最新状态，传入明确的布尔值则直接设置状态；同一个 React 批次内的函数式更新会按顺序组合。
