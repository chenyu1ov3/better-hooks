import { ArrowRight, GitFork } from 'lucide-react';
import Link from 'next/link';
import { hrefFor } from '../lib/content';
import { type Locale } from '../lib/i18n';
import { siteConfig } from '../lib/site';
import { HookSignalVisual } from './hook-signal-visual';

export function LandingPage({ locale }: { locale: Locale }) {
  const copy =
    locale === 'en'
      ? {
          eyebrow: 'React 19 / TypeScript',
          lead: 'Typed, composable hooks for React applications that need predictable behavior.',
          docs: 'Read the docs',
          source: 'View on GitHub',
          factsLabel: 'Package highlights',
          facts: [
            ['React 19', 'Ready'],
            ['ESM', 'Only'],
            ['Runtime deps', 'Zero'],
            ['SSR', 'Friendly'],
          ],
        }
      : {
          eyebrow: 'React 19 / TypeScript',
          lead: '为 React 应用提供类型安全、易于组合且行为可预测的 Hooks。',
          docs: '阅读文档',
          source: '查看 GitHub',
          factsLabel: '包特性',
          facts: [
            ['React 19', '已适配'],
            ['模块格式', '仅 ESM'],
            ['运行时依赖', '零'],
            ['SSR', '友好'],
          ],
        };

  return (
    <section className="hero page-container" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="hero-title">Better Hooks</h1>
        <p className="hero__lead">{copy.lead}</p>
        <div className="hero__actions">
          <Link className="button button--primary" href={hrefFor(locale, 'docs')}>
            {copy.docs}
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <a
            className="button button--secondary"
            href={siteConfig.repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            <GitFork aria-hidden="true" size={17} />
            {copy.source}
          </a>
        </div>
      </div>

      <div className="hero__visual">
        <HookSignalVisual locale={locale} />
      </div>

      <ul className="hero__facts" aria-label={copy.factsLabel}>
        {copy.facts.map(([label, value]) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
