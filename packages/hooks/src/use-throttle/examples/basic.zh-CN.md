# use-throttle

`useThrottle` 会限制快速变化值的更新频率，适用于指针位置、滚动派生值和频繁变化的测量结果。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useThrottle } from 'better-hook/use-throttle';

export function ThrottledRange() {
  const [value, setValue] = useState(0);
  const visibleValue = useThrottle(value, { delay: 100 });

  return (
    <label>
      数值
      <input
        type="range"
        value={value}
        onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
      />
      <output>{visibleValue}</output>
    </label>
  );
}
```

## 行为说明

`leading` 与 `trailing` 默认启用。设置 `trailing: false` 会忽略窗口末尾的值，`maxWait` 也不会绕过该选项更新尾值。
