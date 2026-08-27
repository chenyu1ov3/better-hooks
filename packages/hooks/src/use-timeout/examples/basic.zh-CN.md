# use-timeout

`useTimeout` 会在延迟结束后调用一次最新回调，并提供取消操作与等待状态。重新挂载下面的通知会启动新的计时器。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useTimeout } from 'better-hooks/use-timeout';

function Notice({ onDismiss }: { onDismiss: () => void }) {
  const timeout = useTimeout(onDismiss, 3000);

  return (
    <div role="status">
      <span>设置已保存</span>
      <button type="button" disabled={!timeout.pending} onClick={timeout.cancel}>
        保持显示
      </button>
      <button type="button" onClick={onDismiss}>
        关闭
      </button>
      <output>{timeout.pending ? '三秒后自动关闭' : '已取消自动关闭'}</output>
    </div>
  );
}

export function ExpiringNotice() {
  const [visible, setVisible] = useState(true);

  return visible ? (
    <Notice onDismiss={() => setVisible(false)} />
  ) : (
    <button type="button" onClick={() => setVisible(true)}>
      再次显示通知
    </button>
  );
}
```

## 行为说明

传入 `null` 会禁用计时。修改 `delay` 会替换计时器；只修改回调不会重置截止时间，到期时会执行最新回调。`cancel` 引用稳定、可重复调用，并会清除 `pending`；组件卸载时一定会清理计时器。
