# use-throttle

`useThrottle` 限制快速变化的值的发布频率。滑块原始值会立即变化，而节流值在每个时间窗口内最多发布一次。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useThrottle } from 'better-hooks/use-throttle';

export function ThrottledRange() {
  const [value, setValue] = useState(40);
  const published = useThrottle(value, { delay: 250 });

  return (
    <div>
      <label>
        音量
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
        />
      </label>
      <output>输入值：{value}</output>
      <output aria-live="polite">节流值：{published}</output>
    </div>
  );
}
```

## 行为说明

默认同时启用首沿和尾沿发布：第一次变更立即生效，窗口内的最新变更会被保留。关闭 `trailing` 会丢弃排队的尾沿值；修改 `delay` 会重新开始当前时间窗口。
