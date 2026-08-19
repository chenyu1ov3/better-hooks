import { ArrowRight, GitFork } from 'lucide-react';
import Link from 'next/link';
import { hrefFor } from '../lib/content';
import { hooks } from '../lib/hooks';
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
            ? 'Edit and run every Hook example against the package built from this workspace.'
            : '编辑并运行每个 Hook 的示例，预览结果来自当前工作区构建的包。'
        }
      />
      <Playground locale={locale} />
    </div>
  );
}

export function ChangelogPage({ locale }: { locale: Locale }) {
  const dictionary = dictionaryFor(locale);
  return (
    <div className="product-page page-container changelog-page">
      <PageIntro
        eyebrow={locale === 'en' ? 'Project history' : '项目历史'}
        title={dictionary.navigation.changelog}
        description={
          locale === 'en'
            ? 'Release notes will be published here when the first verified npm release is available.'
            : '首个 npm 版本通过验证并发布后，发行说明会在这里更新。'
        }
      />
      <section className="release-row">
        <div>
          <span>{locale === 'en' ? 'Next' : '下一版'}</span>
          <small>{dictionary.status.preview}</small>
        </div>
        <div>
          <h2>{dictionary.status.releasePending}</h2>
          <p>
            {locale === 'en'
              ? 'The source, API reference, examples, and package validation are public. No registry version is advertised until it can be verified.'
              : '源码、API 文档、示例和包校验结果均已公开。npm 版本通过验证前，这里不会显示发布信息。'}
          </p>
        </div>
      </section>
      <div className="changelog-actions">
        <a
          className="button button--secondary"
          href={`${siteConfig.repositoryUrl}/commits/main`}
          target="_blank"
          rel="noreferrer"
        >
          <GitFork aria-hidden="true" size={16} />
          {locale === 'en' ? 'Repository history' : '提交记录'}
        </a>
        <Link className="text-link" href={hrefFor(locale, 'docs')}>
          {dictionary.actions.viewDocs}
          <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </div>
  );
}
