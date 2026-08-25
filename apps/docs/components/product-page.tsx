import { GitFork, PackageOpen } from 'lucide-react';
import { hooks } from '../lib/hooks';
import { changelogFor } from '../lib/changelog';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { siteConfig } from '../lib/site';
import { HookExplorer } from './hook-explorer';
import { Playground } from './playground';

function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function HooksPage({ locale }: { locale: Locale }) {
  return (
    <div className="product-page page-container">
      <PageIntro
        eyebrow={
          locale === 'en'
            ? `Public API / ${hooks.length} Hooks`
            : `公开 API / ${hooks.length} 个 Hook`
        }
        title={locale === 'en' ? 'Hook index' : 'Hook 索引'}
        description={
          locale === 'en'
            ? 'Search by behavior, category, or TypeScript signature. Every entry links to its runtime contract and source.'
            : '按使用场景、分类或 TypeScript 签名查找 Hook，并查看完整的行为说明与源码。'
        }
      />
      <HookExplorer locale={locale} syncUrl />
    </div>
  );
}

export function PlaygroundPage({ locale }: { locale: Locale }) {
  return (
    <div className="product-page page-container">
      <PageIntro
        eyebrow={locale === 'en' ? 'Editable / Source-backed' : '在线编辑 / 源码示例'}
        title={locale === 'en' ? 'Hook playground' : 'Hook 在线演练'}
        description={
          locale === 'en'
            ? 'Edit and run every Hook example directly in the browser.'
            : '直接在浏览器中编辑并运行每个 Hook 的示例。'
        }
      />
      <Playground locale={locale} />
    </div>
  );
}

export function ChangelogPage({ locale }: { locale: Locale }) {
  const dictionary = dictionaryFor(locale);
  const release = changelogFor(locale);
  const releaseId = `release-${release.version.replaceAll(/[^a-zA-Z0-9]+/g, '-')}`;
  return (
    <div className="product-page page-container changelog-page">
      <PageIntro
        eyebrow={release.eyebrow}
        title={dictionary.navigation.changelog}
        description={release.description}
      />
      <article className="release-row" aria-labelledby={releaseId}>
        <header>
          <span>npm</span>
          <h2 id={releaseId}>{release.version}</h2>
        </header>
        <div className="release-notes">
          {release.sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </section>
          ))}
        </div>
      </article>
      <div className="changelog-actions">
        <a
          className="button button--secondary"
          href={`${siteConfig.npmUrl}/v/${release.version}`}
          target="_blank"
          rel="noreferrer"
        >
          <PackageOpen aria-hidden="true" size={16} />
          {release.viewNpm}: {release.version}
        </a>
        <a
          className="button button--secondary"
          href={`${siteConfig.repositoryUrl}/releases/tag/better-hooks@${release.version}`}
          target="_blank"
          rel="noreferrer"
        >
          <GitFork aria-hidden="true" size={16} />
          {release.history}
        </a>
      </div>
    </div>
  );
}
