# use-debounce-fn

`useDebounceFn` 会在调用停止一段时间后执行函数，同时提供明确的取消、立即执行和等待状态。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useDebounceFn } from 'better-hooks/use-debounce-fn';

export function DraftSaver() {
  const [saved, setSaved] = useState('');
  const save = useDebounceFn((value: string) => setSaved(value), { delay: 500 });

  return (
    <div>
      <input aria-label="草稿" onChange={(event) => save.run(event.currentTarget.value)} />
      <button type="button" onClick={save.flush}>
        立即保存
      </button>
      <button type="button" onClick={save.cancel}>
        取消
      </button>
      <output>{save.pending ? '等待保存' : saved}</output>
    </div>
  );
}
```

## 行为说明

`pending` 只表示当前确实有一次调用正在等待。`flush` 会立即执行，`cancel` 会丢弃任务，组件卸载时会清除全部定时器。
