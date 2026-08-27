# use-event-listener

`useEventListener` 订阅原生 `EventTarget`，回调更新时无需重新安装监听器。使用 ref 目标可以让此示例的事件限制在预览内部。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useEventListener } from 'better-hooks/use-event-listener';

export function NativeClickCounter() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [clicks, setClicks] = useState(0);

  useEventListener(buttonRef, 'click', () => {
    setClicks((value) => value + 1);
  });

  return (
    <div>
      <button ref={buttonRef} type="button">
        原生事件目标
      </button>
      <output aria-live="polite">原生点击次数：{clicks}</output>
    </div>
  );
}
```

## 行为说明

Hook 会在每次提交后解析直接目标或 ref 目标。回调变化会直接发布而不重新绑定；目标、事件类型、`capture`、`passive`、`once` 或 `signal` 变化时会安装匹配的原生监听器。组件卸载一定会移除活动绑定。
