# use-debounce-fn

`useDebounceFn` 会等活动停止后再执行最近一次函数调用。它提供的控制项会指出是否存在真正的尾沿任务，并允许立即执行或丢弃该任务。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useDebounceFn } from 'better-hooks/use-debounce-fn';

export function DraftSaver() {
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState('尚未保存');
  const save = useDebounceFn((value: string) => setSaved(value || '空草稿'), { delay: 800 });

  const updateDraft = (value: string) => {
    setDraft(value);
    save.run(value);
  };

  return (
    <div>
      <label>
        草稿
        <textarea value={draft} onChange={(event) => updateDraft(event.currentTarget.value)} />
      </label>
      <button type="button" disabled={!save.pending} onClick={save.flush}>
        立即保存
      </button>
      <button type="button" disabled={!save.pending} onClick={save.cancel}>
        取消待保存任务
      </button>
      <output aria-live="polite">{save.pending ? '等待保存' : `已保存：${saved}`}</output>
    </div>
  );
}
```

## 行为说明

`run` 只保留最新参数。仅当尾沿调用确实已排队时，`pending` 才为 `true`；`flush` 会立即执行并返回回调结果，`cancel` 则丢弃任务。选项变化会重新安排活动任务，组件卸载会清理全部计时器。
