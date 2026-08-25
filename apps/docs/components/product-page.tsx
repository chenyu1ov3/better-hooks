import { GitFork, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <header className="max-w-3xl">
      <p className="m-0 text-xs font-bold text-brand uppercase">{eyebrow}</p>
      <h1 className="mt-3 text-4xl leading-tight font-bold text-balance text-foreground md:text-[44px]">
        {title}
      </h1>
      <p className="mt-4 max-w-[65ch] text-base leading-7 text-pretty text-muted-foreground">
        {description}
      </p>
    </header>
  );
}

export function HooksPage({ locale }: { locale: Locale }) {
  return (
    <div className="page-container pt-10 pb-24 md:pt-14 md:pb-28">
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
    <div className="page-container pt-10 pb-24 md:pt-14 md:pb-28">
      <PageIntro
        eyebrow={locale === 'en' ? 'Editable / Source-backed' : '在线编辑 / 源码示例'}
        title={locale === 'en' ? 'Hook playground' : 'Hook 在线演练'}
        description={
          locale === 'en'
            ? 'Edit and run every Hook example directly in the browser.'
            : '直接在浏览器中编辑并运行每个 Hook 的示例。'
        }
      />
      <div className="mt-9 md:mt-10">
        <Playground locale={locale} />
      </div>
    </div>
  );
}

export function ChangelogPage({ locale }: { locale: Locale }) {
  const dictionary = dictionaryFor(locale);
  const release = changelogFor(locale);
  const releaseId = `release-${release.version.replaceAll(/[^a-zA-Z0-9]+/g, '-')}`;
  return (
    <div className="page-container pt-10 pb-24 md:pt-14 md:pb-28">
      <PageIntro
        eyebrow={release.eyebrow}
        title={dictionary.navigation.changelog}
        description={release.description}
      />
      <article
        className="mt-10 grid gap-6 border-y border-border py-7 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-10 md:py-9"
        aria-labelledby={releaseId}
      >
        <header className="min-w-0">
          <span className="font-mono text-xs text-brand">npm</span>
          <h2 className="mt-2 font-mono text-2xl font-semibold text-foreground" id={releaseId}>
            {release.version}
          </h2>
        </header>
        <div className="grid gap-6">
          {release.sections.map((section) => (
            <section
              className="border-b border-border pb-6 last:border-0 last:pb-0"
              key={section.title}
            >
              <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
            </section>
          ))}
        </div>
      </article>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild variant="outline" className="min-h-11">
          <a href={`${siteConfig.npmUrl}/v/${release.version}`} target="_blank" rel="noreferrer">
            <PackageOpen aria-hidden="true" size={16} />
            {release.viewNpm}: {release.version}
          </a>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <a
            href={`${siteConfig.repositoryUrl}/releases/tag/better-hooks@${release.version}`}
            target="_blank"
            rel="noreferrer"
          >
            <GitFork aria-hidden="true" size={16} />
            {release.history}
          </a>
        </Button>
      </div>
    </div>
  );
}
