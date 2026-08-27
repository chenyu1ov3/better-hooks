# use-memoized-fn

`useMemoizedFn` 保持函数引用稳定，同时让每次调用使用最近提交的实现。这样，长期存在的订阅无需重建也能读取最新状态。

## 示例

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useMemoizedFn } from 'better-hooks/use-memoized-fn';

export function StableGreetingSubscription() {
  const [name, setName] = useState('艾达');
  const [message, setMessage] = useState('尚未问候');
  const [events] = useState(() => new EventTarget());
  const greet = useMemoizedFn(() => setMessage(`你好，${name}`));

  useEffect(() => {
    events.addEventListener('greet', greet);
    return () => events.removeEventListener('greet', greet);
  }, [events, greet]);

  return (
    <div>
      <label>
        姓名
        <input value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </label>
      <button type="button" onClick={() => events.dispatchEvent(new Event('greet'))}>
        触发问候事件
      </button>
      <output aria-live="polite">{message}</output>
    </div>
  );
}
```

## 行为说明

返回函数的引用始终不变，因此上面的 Effect 只需订阅一次。每次成功提交后，内部实现都会替换为最新版本，事件总能读取最新姓名，同时不会暴露被放弃渲染中的回调。
