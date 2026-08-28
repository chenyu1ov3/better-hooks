# use-set

`useSet` 保持一个只读 Set 快照，并提供稳定的添加、删除、切换、清空和重置操作。

## 示例

```tsx
'use client';

import { useSet } from 'better-hooks/use-set';

export function SetExample() {
  const [selected, actions] = useSet<string>(['selected']);

  return (
    <div>
      <output>{selected.has('selected') ? '已选择' : '空集合'}</output>
      <button type="button" onClick={() => actions.toggle('selected')}>
        切换
      </button>
      <button type="button" onClick={actions.reset}>
        重置
      </button>
    </div>
  );
}
```

## 行为说明

初始值只会复制一次。添加已有值或删除不存在的值会保留当前快照引用。`toggle` 会基于最新排队的 Set 状态进行连续计算。
