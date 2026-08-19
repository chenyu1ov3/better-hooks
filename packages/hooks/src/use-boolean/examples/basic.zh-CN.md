# use-boolean

`useBoolean` 为布尔状态提供具名操作。当 `setTrue` 和 `setFalse` 比元组中的更新函数更能表达意图时，可以使用它。

## 示例

```tsx
'use client';

import { useBoolean } from 'better-hook/use-boolean';

export function DetailsToggle() {
  const details = useBoolean();

  return (
    <div>
      <button type="button" onClick={details.setTrue}>
        显示
      </button>
      <button type="button" onClick={details.setFalse}>
        隐藏
      </button>
      <button type="button" onClick={() => details.toggle()}>
        切换
      </button>
      <output>{details.value ? '已显示' : '已隐藏'}</output>
    </div>
  );
}
```

## 行为说明

所有操作函数在重新渲染之间保持稳定。`boolean` 是 `value` 的别名，`toggle` 也接受明确的布尔值或函数式更新。
