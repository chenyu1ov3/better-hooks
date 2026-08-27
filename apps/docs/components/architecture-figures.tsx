import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import packageMetrics from '../generated/package-metrics.json';
import type { Locale } from '../lib/i18n';
import styles from './architecture-figures.module.css';

type PackageMetricsProps = {
  locale: Locale;
  variant?: 'full' | 'summary';
};

type MetricEntry = (typeof packageMetrics.entries)[number];

function formatBytes(bytes: number, locale: Locale) {
  if (bytes < 1000) return `${bytes.toLocaleString(locale)} B`;
  const value = bytes / 1000;
  return `${value.toLocaleString(locale, {
    minimumFractionDigits: value < 10 ? 2 : 1,
    maximumFractionDigits: value < 10 ? 2 : 1,
  })} kB`;
}

function entryName(entry: MetricEntry) {
  return entry.entry.replace(`${packageMetrics.package}/`, '');
}

function metricsLabels(locale: Locale) {
  return locale === 'zh-CN'
    ? {
        caption: 'better-hooks 构建报告',
        build: `v${packageMetrics.version} · 构建 ${packageMetrics.buildFingerprint}`,
        directEntries: '独立入口',
        medianGzip: 'gzip 中位数',
        rootGzip: '根入口完整图',
        budgets: '通过体积预算',
        ranking: 'gzip 最大的独立入口',
        rankingDescription: '每一条均包含该入口唯一可达的内部模块。',
        allEntries: `查看全部 ${packageMetrics.summary.directEntries} 个独立入口`,
        tableRegion: '全部独立入口体积明细，可横向滚动',
        entry: '入口',
        modules: '模块',
        raw: 'Raw',
        gzip: 'gzip',
        brotli: 'Brotli',
        budget: 'gzip / 预算',
        withinBudget: '预算内',
        measurement: `未经压缩的 ${packageMetrics.measurement.format} · ${packageMetrics.measurement.target} · React 保持外部依赖 · Node.js zlib 默认 gzip / Brotli 参数`,
        percentile: `第 90 百分位 gzip：${formatBytes(packageMetrics.summary.p90GzipBytes, locale)}`,
      }
    : {
        caption: 'better-hooks build report',
        build: `v${packageMetrics.version} · build ${packageMetrics.buildFingerprint}`,
        directEntries: 'Direct entries',
        medianGzip: 'Median gzip',
        rootGzip: 'Complete root graph',
        budgets: 'Within size budget',
        ranking: 'Largest direct entries by gzip',
        rankingDescription:
          'Each row includes the entry and its unique reachable internal modules.',
        allEntries: `View all ${packageMetrics.summary.directEntries} direct entries`,
        tableRegion: 'All direct entry size details, horizontally scrollable',
        entry: 'Entry',
        modules: 'Modules',
        raw: 'Raw',
        gzip: 'gzip',
        brotli: 'Brotli',
        budget: 'gzip / budget',
        withinBudget: 'Within budget',
        measurement: `Unminified ${packageMetrics.measurement.format} · ${packageMetrics.measurement.target} · React external · Node.js zlib default gzip / Brotli settings`,
        percentile: `90th percentile gzip: ${formatBytes(packageMetrics.summary.p90GzipBytes, locale)}`,
      };
}

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The overflow region must be keyboard-scrollable. */
export function PackageMetrics({ locale, variant = 'full' }: PackageMetricsProps) {
  const labels = metricsLabels(locale);
  const largestEntries = [...packageMetrics.entries]
    .sort((left, right) => right.gzipBytes - left.gzipBytes)
    .slice(0, 8);
  const largestGzip = largestEntries[0]?.gzipBytes ?? 1;

  return (
    <figure
      className={styles.figure}
      data-package-metrics
      data-package-version={packageMetrics.version}
    >
      <figcaption className={styles.figureCaption}>
        <strong>{labels.caption}</strong>
        <span>{labels.build}</span>
      </figcaption>

      <dl className={styles.metricGrid}>
        <div className={styles.metricCell}>
          <dt>{labels.directEntries}</dt>
          <dd>{packageMetrics.summary.directEntries}</dd>
        </div>
        <div className={styles.metricCell}>
          <dt>{labels.medianGzip}</dt>
          <dd>{formatBytes(packageMetrics.summary.medianGzipBytes, locale)}</dd>
        </div>
        <div className={styles.metricCell}>
          <dt>{labels.rootGzip}</dt>
          <dd>{formatBytes(packageMetrics.root.gzipBytes, locale)}</dd>
        </div>
        <div className={styles.metricCell}>
          <dt>{labels.budgets}</dt>
          <dd>
            {packageMetrics.summary.withinBudget} / {packageMetrics.summary.directEntries}
          </dd>
        </div>
      </dl>

      {variant === 'full' ? (
        <>
          <div className={styles.rankingHeader}>
            <strong>{labels.ranking}</strong>
            <span>{labels.rankingDescription}</span>
          </div>
          <ol className={styles.ranking} aria-label={labels.ranking}>
            {largestEntries.map((entry) => (
              <li className={styles.rankingItem} key={entry.entry}>
                <span className={styles.entryName}>{entryName(entry)}</span>
                <span className={styles.meter} aria-hidden="true">
                  <span
                    className={styles.meterFill}
                    style={{ width: `${Math.max(4, (entry.gzipBytes / largestGzip) * 100)}%` }}
                  />
                </span>
                <span className={styles.metricBytes}>{formatBytes(entry.gzipBytes, locale)}</span>
              </li>
            ))}
          </ol>

          <details className={styles.details}>
            <summary>
              <span>{labels.allEntries}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </summary>
            <div
              className={styles.tableRegion}
              role="region"
              aria-label={labels.tableRegion}
              tabIndex={0}
            >
              <table className={styles.metricsTable}>
                <thead>
                  <tr>
                    <th scope="col">{labels.entry}</th>
                    <th scope="col">{labels.modules}</th>
                    <th scope="col">{labels.raw}</th>
                    <th scope="col">{labels.gzip}</th>
                    <th scope="col">{labels.brotli}</th>
                    <th scope="col">{labels.budget}</th>
                  </tr>
                </thead>
                <tbody>
                  {packageMetrics.entries.map((entry) => (
                    <tr key={entry.entry}>
                      <th scope="row">{entryName(entry)}</th>
                      <td>{entry.modules}</td>
                      <td>{formatBytes(entry.rawBytes, locale)}</td>
                      <td>{formatBytes(entry.gzipBytes, locale)}</td>
                      <td>{formatBytes(entry.brotliBytes, locale)}</td>
                      <td>
                        <span className={styles.budgetValue}>
                          <Check aria-hidden="true" size={14} />
                          <span className="sr-only">{labels.withinBudget}: </span>
                          {formatBytes(entry.gzipBytes, locale)} /{' '}
                          {formatBytes(entry.gzipBudgetBytes, locale)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : null}

      <div className={styles.measurementNote}>
        <span>{labels.measurement}</span>
        <span>{labels.percentile}</span>
      </div>
    </figure>
  );
}
/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */

function architectureLabels(locale: Locale) {
  return locale === 'zh-CN'
    ? {
        caption: '从包入口到宿主资源的所有权边界',
        direction: '依赖方向从上到下；资源所有权从下向上明确回收。',
        layers: [
          ['公开入口', 'better-hooks/*', '根入口与逐 Hook ESM 边界'],
          ['Hook 契约', '稳定操作', '已提交回调、取消、服务端快照'],
          ['共享运行时', '限定作用域 Store', '计时、存储、错误与外部状态源'],
          ['React 所有权', 'Effect + 订阅', '提交后建立，对称清理'],
          ['宿主原语', '浏览器 + 网络', '事件、定时器、Observer、存储与 WebSocket'],
        ],
      }
    : {
        caption: 'Ownership boundaries from package entry to host resource',
        direction: 'Dependencies move downward; cleanup makes resource ownership explicit upward.',
        layers: [
          ['Public entries', 'better-hooks/*', 'Root and per-Hook ESM boundaries'],
          [
            'Hook contracts',
            'stable actions',
            'Committed callbacks, cancellation, server snapshots',
          ],
          ['Shared runtime', 'scoped stores', 'Timing, storage, errors, and external sources'],
          ['React ownership', 'effects + subscriptions', 'Setup after commit, symmetric cleanup'],
          [
            'Host primitives',
            'browser + network',
            'Events, timers, observers, storage, and WebSocket',
          ],
        ],
      };
}

export function ArchitectureMap({ locale }: { locale: Locale }) {
  const labels = architectureLabels(locale);
  return (
    <figure className={styles.figure} data-architecture-map>
      <figcaption className={styles.figureCaption}>
        <strong>{labels.caption}</strong>
        <span>{labels.direction}</span>
      </figcaption>
      <ol className={styles.layerList}>
        {labels.layers.map(([title, mechanism, description], index) => (
          <li className={styles.layer} key={title}>
            <span className={styles.layerMarker} aria-hidden="true" />
            <strong>{title}</strong>
            <span className={styles.layerMechanism}>{mechanism}</span>
            <span className={styles.layerDescription}>{description}</span>
            {index < labels.layers.length - 1 ? (
              <ArrowRight className={styles.layerArrow} aria-hidden="true" size={15} />
            ) : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}

function decisionLabels(locale: Locale) {
  const prefix = locale === 'zh-CN' ? '/zh' : '';
  return locale === 'zh-CN'
    ? {
        label: '已采纳的架构决策',
        accepted: '已采纳',
        decisions: [
          ['001', '运行时边界', '保持导入与渲染纯净，在提交后持有浏览器任务。', '001-boundaries'],
          ['002', 'API 语义', '稳定操作、最新回调、取消与错误传播。', '002-api-semantics'],
          ['003', '包工具链', 'ESM exports、类型声明与可审计发布产物。', '003-toolchain'],
          ['004', '性能证据', '同源体积预算、构建报告与运行时所有权。', '004-performance'],
          ['005', '验证与发布门禁', '从源码、类型和文档一直验证到 tarball。', '005-verification'],
        ].map((decision) => [...decision, `${prefix}/docs/architecture/adr/${decision[3]}`]),
      }
    : {
        label: 'Accepted architecture decisions',
        accepted: 'Accepted',
        decisions: [
          [
            '001',
            'Runtime boundaries',
            'Pure imports and render; browser work owned after commit.',
            '001-boundaries',
          ],
          [
            '002',
            'API semantics',
            'Stable actions, current callbacks, cancellation, and error propagation.',
            '002-api-semantics',
          ],
          [
            '003',
            'Package toolchain',
            'ESM exports, declarations, and an auditable release artifact.',
            '003-toolchain',
          ],
          [
            '004',
            'Performance evidence',
            'Shared size budgets, build reports, and runtime ownership.',
            '004-performance',
          ],
          [
            '005',
            'Verification gates',
            'Source, types, docs, and the tarball verified as one contract.',
            '005-verification',
          ],
        ].map((decision) => [...decision, `${prefix}/docs/architecture/adr/${decision[3]}`]),
      };
}

export function ArchitectureDecisions({ locale }: { locale: Locale }) {
  const labels = decisionLabels(locale);
  return (
    <ol className={styles.decisionList} aria-label={labels.label} data-architecture-decisions>
      {labels.decisions.map(([number, title, description, , href]) => (
        <li key={number}>
          <Link className={styles.decisionLink} href={href}>
            <span className={styles.decisionNumber}>{number}</span>
            <span className={styles.decisionCopy}>
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
            <span className={styles.decisionStatus}>
              <Check aria-hidden="true" size={14} />
              {labels.accepted}
              <ArrowRight aria-hidden="true" size={15} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
