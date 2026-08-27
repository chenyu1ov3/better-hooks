# use-input

`useInput` 为文本输入框和多行文本框提供值、变更、清空与重置能力，同时接受原生变更事件和直接传入的字符串。

## 示例

```tsx
'use client';

import { useInput } from 'better-hooks/use-input';

export function DisplayNameField() {
  const name = useInput({ initialValue: '艾达·洛芙莱斯' });

  return (
    <div>
      <label>
        显示名称
        <input value={name.value} onChange={name.onChange} />
      </label>
      <button type="button" onClick={() => name.onChange('格蕾丝·霍珀')}>
        使用示例
      </button>
      <button type="button" disabled={!name.value} onClick={name.clear}>
        清空
      </button>
      <button type="button" onClick={name.reset}>
        重置
      </button>
      <output aria-live="polite">共 {name.value.length} 个字符</output>
    </div>
  );
}
```

## 行为说明

初始值以及受控/非受控模式都会在首次渲染时确定。非受控模式下 Hook 自行更新值；受控模式下所有操作都通过 `onChange` 请求外部更新。运行期间切换模式会在开发环境给出警告。
