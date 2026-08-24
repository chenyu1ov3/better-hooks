# use-timeout

`useTimeout` 会在延迟结束后调用一次最新回调，并提供取消操作和 `pending` 状态。传入 `null` 时定时器保持停用。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useTimeout } from 'better-hooks/use-timeout';

export function ExpiringNotice() {
  const [visible, setVisible] = useState(true);
  const timeout = useTimeout(() => setVisible(false), 5000);

  return visible ? (
    <div>
      <span>保存成功</span>
      <button type="button" disabled={!timeout.pending} onClick={timeout.cancel}>
        保持显示
      </button>
    </div>
  ) : null;
}
```

## 行为说明

延迟变化会替换定时器，仅回调变化不会重新计时。取消操作可重复调用，在首次提交期间调用也同样有效。
