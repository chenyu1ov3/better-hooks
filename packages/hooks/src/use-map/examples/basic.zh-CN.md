# use-map

`useMap` 保持一个只读 Map 快照，并提供用于不可变更新的稳定操作函数。

## 示例

```tsx
'use client';

import { useMap } from 'better-hooks/use-map';

export function MapExample() {
  const [map, actions] = useMap<string, string>([['status', 'ready']]);

  return (
    <div>
      <output>{map.get('status')}</output>
      <button type="button" onClick={() => actions.set('status', 'saved')}>
        保存
      </button>
      <button type="button" onClick={actions.reset}>
        重置
      </button>
    </div>
  );
}
```

## 行为说明

初始 entries 只会复制一次。每次有效更新都会创建新的 Map 快照；无效更新会保留当前快照引用。`reset` 恢复捕获的 entries，`clear` 删除全部 entries。
