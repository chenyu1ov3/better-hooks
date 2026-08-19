# use-input

`useInput` 为文本输入框和 `textarea` 提供值更新、清空与重置能力。它既能在内部管理字符串，也能向受控父组件请求更新。

## 示例

```tsx
'use client';

import { useInput } from 'better-hook/use-input';

export function NameField() {
  const name = useInput({ initialValue: 'Ada' });

  return (
    <div>
      <label>
        姓名 <input value={name.value} onChange={name.onChange} />
      </label>
      <button type="button" onClick={name.clear}>
        清空
      </button>
      <button type="button" onClick={name.reset}>
        重置
      </button>
      <output>{name.value}</output>
    </div>
  );
}
```

## 行为说明

初始值只会捕获一次。第一次渲染会固定受控或非受控模式，之后切换模式会在开发环境发出警告。
