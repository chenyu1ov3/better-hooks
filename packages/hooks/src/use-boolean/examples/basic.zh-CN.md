# use-boolean

`useBoolean` 使用具名且引用稳定的操作管理布尔状态。当 `setTrue` 和 `setFalse` 比通用 setter 更能表达意图时，它尤其合适。

## 示例

```tsx
'use client';

import { useBoolean } from 'better-hooks/use-boolean';

export function NotificationSetting() {
  const notifications = useBoolean(true);

  return (
    <div>
      <button
        type="button"
        aria-pressed={notifications.value}
        onClick={() => notifications.toggle()}
      >
        {notifications.value ? '通知已开启' : '通知已关闭'}
      </button>
      <button type="button" disabled={notifications.value} onClick={notifications.setTrue}>
        开启
      </button>
      <button type="button" disabled={!notifications.value} onClick={notifications.setFalse}>
        关闭
      </button>
      <output aria-live="polite">当前值：{String(notifications.boolean)}</output>
    </div>
  );
}
```

## 行为说明

`value` 和 `boolean` 暴露同一状态。`setTrue`、`setFalse` 与 `toggle` 的引用保持稳定；调用无参数的 `toggle()` 会反转最新值，也可以传入明确的布尔值或函数式更新器。
