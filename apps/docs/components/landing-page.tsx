import { ArrowRight, GitFork } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { hrefFor } from '../lib/content';
import type { Locale } from '../lib/i18n';
import { siteConfig } from '../lib/site';
import { CopyButton } from './copy-button';
import { HighlightedCommand } from './highlighted-code';
import { HookRuntimeDemo } from './hook-runtime-demo';

export function LandingPage({ locale }: { locale: Locale }) {
  const copy =
    locale === 'en'
      ? {
          lead: 'Typed, composable hooks for React applications that need predictable behavior.',
          docs: 'Read the docs',
          source: 'View on GitHub',
          install: 'Install better-hooks',
          copyInstall: 'Copy install command',
          copiedInstall: 'Install command copied',
        }
      : {
          lead: '为 React 应用提供类型安全、易于组合且行为可预测的 Hooks。',
          docs: '阅读文档',
          source: '查看 GitHub',
          install: '安装 better-hooks',
          copyInstall: '复制安装命令',
          copiedInstall: '安装命令已复制',
        };

  return (
    <section
      className="precision-grid mx-auto grid min-h-[calc(100svh-var(--header-height))] w-full max-w-[1360px] grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 md:py-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(500px,1.2fr)] lg:gap-14 xl:gap-24"
      aria-labelledby="hero-title"
    >
      <div className="max-w-[660px]">
        <h1
          id="hero-title"
          className="m-0 text-5xl leading-[0.98] font-[780] text-balance text-foreground sm:text-6xl lg:text-[66px]"
        >
          Better Hooks
        </h1>
        <p className="mt-5 max-w-[620px] text-lg leading-8 text-pretty text-muted-foreground">
          {copy.lead}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button asChild size="lg" className="h-11 px-5 font-bold">
            <Link href={hrefFor(locale, 'docs')}>
              {copy.docs}
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5 font-bold">
            <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer">
              <GitFork aria-hidden="true" size={17} />
              {copy.source}
            </a>
          </Button>
        </div>
        <div
          className="mt-3 grid min-h-11 w-full max-w-[360px] grid-cols-[minmax(0,1fr)_44px] items-center overflow-hidden rounded-md border border-border bg-muted"
          aria-label={copy.install}
        >
          <HighlightedCommand code="pnpm add better-hooks" />
          <CopyButton
            value="pnpm add better-hooks"
            label={copy.copyInstall}
            copiedLabel={copy.copiedInstall}
            className="h-11 w-11 rounded-none border-l border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          />
        </div>
      </div>

      <div className="min-w-0 w-full lg:justify-self-end">
        <HookRuntimeDemo locale={locale} />
      </div>
    </section>
  );
}
