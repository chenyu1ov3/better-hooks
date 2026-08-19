import type { Locale } from '../lib/i18n';

const signals = [
  { id: 'debounce', hook: 'useDebounce', output: 'settled' },
  { id: 'async', hook: 'useAsync', output: 'abort' },
  { id: 'online', hook: 'useOnline', output: 'unsubscribe' },
] as const;

export function HookSignalVisual({ locale }: { locale: Locale }) {
  const copy =
    locale === 'en'
      ? {
          label: 'Hook signals moving through render, commit, and cleanup',
          runtime: 'Hook runtime',
          trace: 'signal trace / 03',
          phases: ['render', 'commit', 'cleanup'],
          stable: 'committed values stable',
          registered: 'cleanup registered',
        }
      : {
          label: 'Hook 信号依次经过渲染、提交和清理阶段',
          runtime: 'Hook 运行时',
          trace: '信号轨迹 / 03',
          phases: ['渲染', '提交', '清理'],
          stable: '提交值已稳定',
          registered: '清理函数已注册',
        };

  return (
    <figure
      className="hook-flow"
      data-testid="hook-lifecycle-visual"
      aria-labelledby="hook-flow-caption"
    >
      <figcaption id="hook-flow-caption" className="sr-only">
        {copy.label}
      </figcaption>

      <div className="hook-flow__header" aria-hidden="true">
        <span>{copy.runtime}</span>
        <code>{copy.trace}</code>
      </div>

      <div className="hook-flow__timeline" aria-hidden="true">
        <div className="hook-flow__phases">
          {copy.phases.map((phase, index) => (
            <span
              key={phase}
              className={`hook-flow__phase hook-flow__phase--${index + 1}`}
              data-hook-phase={['render', 'commit', 'cleanup'][index]}
            >
              <b>0{index + 1}</b>
              {phase}
            </span>
          ))}
        </div>

        <ol className="hook-flow__signals">
          {signals.map((signal) => (
            <li
              key={signal.id}
              className={`hook-flow__signal hook-flow__signal--${signal.id}`}
              data-hook-signal={signal.id}
            >
              <code>{signal.hook}</code>
              <div className="hook-flow__track">
                <span className="hook-flow__checkpoint hook-flow__checkpoint--render" />
                <span className="hook-flow__checkpoint hook-flow__checkpoint--commit" />
                <span className="hook-flow__checkpoint hook-flow__checkpoint--cleanup" />
                <span className="hook-flow__pulse" />
                <output>{signal.output}</output>
              </div>
            </li>
          ))}
        </ol>

        <div className="hook-flow__status">
          <span>{copy.stable}</span>
          <span>{copy.registered}</span>
        </div>
      </div>
    </figure>
  );
}
