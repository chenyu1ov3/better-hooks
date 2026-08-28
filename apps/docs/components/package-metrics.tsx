import { Check, ChevronDown } from 'lucide-react';
import packageMetrics from '../generated/package-metrics.json';
import type { Locale } from '../lib/i18n';
import styles from './package-metrics.module.css';

type PackageMetricsProps = {
  locale: Locale;
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
export function PackageMetrics({ locale }: PackageMetricsProps) {
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

      <div className={styles.measurementNote}>
        <span>{labels.measurement}</span>
        <span>{labels.percentile}</span>
      </div>
    </figure>
  );
}
/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */
