import { notFound } from 'next/navigation';
import { documentForPath, isProductRoute } from '../lib/routes';
import type { Locale } from '../lib/i18n';
import { DocsShell } from './docs-shell';
import { DocumentPage } from './document-page';
import { LandingPage } from './landing-page';
import { ChangelogPage, HooksPage, PlaygroundPage } from './product-page';
import { SiteFrame } from './site-frame';

export async function RouteView({ locale, path }: { locale: Locale; path: string[] }) {
  if (!path.length) {
    return (
      <SiteFrame
        locale={locale}
        currentPath={path}
        mainClassName="min-h-[calc(100svh-var(--header-height))]"
        showFooter={false}
      >
        <LandingPage locale={locale} />
      </SiteFrame>
    );
  }
  if (path.length === 1 && isProductRoute(path[0])) {
    const Page = {
      hooks: HooksPage,
      playground: PlaygroundPage,
      changelog: ChangelogPage,
    }[path[0]];
    return (
      <SiteFrame locale={locale} currentPath={path} mainClassName="min-h-[75vh]">
        <Page locale={locale} />
      </SiteFrame>
    );
  }
  const document = documentForPath(locale, path);
  if (!document) notFound();
  return (
    <SiteFrame locale={locale} currentPath={path} mainClassName="min-h-[75vh]">
      <DocsShell locale={locale} currentPath={path} headings={document.headings}>
        <DocumentPage document={document} />
      </DocsShell>
    </SiteFrame>
  );
}
