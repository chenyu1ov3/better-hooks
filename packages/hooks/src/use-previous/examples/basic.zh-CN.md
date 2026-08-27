# use-previous

`usePrevious` 返回上一次成功提交的值，适合在不增加重复状态的情况下渲染前后对比。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { usePrevious } from 'better-hooks/use-previous';

export function PriceChange() {
  const [price, setPrice] = useState(24);
  const previousPrice = usePrevious(price);
  const direction = previousPrice === undefined ? '暂无前值' : `${previousPrice} 变为 ${price}`;

  return (
    <div>
      <button type="button" onClick={() => setPrice((value) => value - 1)}>
        降低
      </button>
      <button type="button" onClick={() => setPrice((value) => value + 1)}>
        提高
      </button>
      <output aria-live="polite">{direction}</output>
    </div>
  );
}
```

## 行为说明

未提供初始回退值时，首次渲染返回 `undefined`。内部 ref 只会在成功提交后更新，因此被并发渲染放弃的值不会成为前值。
