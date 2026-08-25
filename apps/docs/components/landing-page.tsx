import { ArrowRight, GitFork } from 'lucide-react';
import Link from 'next/link';
import { hrefFor } from '../lib/content';
import { hookCategories, hookCategoryCounts, hooks } from '../lib/hooks';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { siteConfig } from '../lib/site';
import { CopyButton } from './copy-button';
import { HookSignalVisual } from './hook-signal-visual';

export function LandingPage({ locale }: { locale: Locale }) {
  const dictionary = dictionaryFor(locale);
  const copy =
    locale === 'en'
      ? {
          eyebrow: 'React 19 / TypeScript',
          lead: 'Typed, composable hooks for React applications that need predictable behavior.',
          docs: 'Read the docs',
          source: 'View on GitHub',
          install: 'Install better-hooks',
          copyInstall: 'Copy install command',
          copiedInstall: 'Install command copied',
          factsLabel: 'Package highlights',
          facts: [
            ['React 19', 'Ready'],
            ['ESM', 'Only'],
            ['Runtime deps', 'Zero'],
            ['SSR', 'Friendly'],
          ],
          categoriesEyebrow: 'Browse the API',
          categoriesTitle: `${hooks.length} Hooks`,
          categoriesLabel: 'Hook categories',
          hookCount: (count: number) => `${count} ${count === 1 ? 'Hook' : 'Hooks'}`,
        }
      : {
          eyebrow: 'React 19 / TypeScript',
          lead: '为 React 应用提供类型安全、易于组合且行为可预测的 Hooks。',
          docs: '阅读文档',
          source: '查看 GitHub',
          install: '安装 better-hooks',
          copyInstall: '复制安装命令',
          copiedInstall: '安装命令已复制',
          factsLabel: '包特性',
          facts: [
            ['React 19', '已适配'],
            ['模块格式', '仅 ESM'],
            ['运行时依赖', '零'],
            ['SSR', '友好'],
          ],
          categoriesEyebrow: '浏览 API',
          categoriesTitle: `${hooks.length} 个 Hook`,
          categoriesLabel: 'Hook 分类',
          hookCount: (count: number) => `${count} 个 Hook`,
        };

  return (
    <>
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
          <div className="hero__install" aria-label={copy.install}>
            <code>pnpm add better-hooks</code>
            <CopyButton
              value="pnpm add better-hooks"
              label={copy.copyInstall}
              copiedLabel={copy.copiedInstall}
              className="hero__copy-command"
            />
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

      <section className="home-categories section-band" aria-labelledby="hook-categories-title">
        <div className="home-categories__inner page-container">
          <header>
            <p className="eyebrow">{copy.categoriesEyebrow}</p>
            <h2 id="hook-categories-title">{copy.categoriesTitle}</h2>
          </header>
          <nav className="category-rail" aria-label={copy.categoriesLabel}>
            {hookCategories.map((category) => (
              <Link key={category} href={`${hrefFor(locale, 'hooks')}?category=${category}`}>
                <span>{dictionary.categories[category]}</span>
                <small>{copy.hookCount(hookCategoryCounts[category])}</small>
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
