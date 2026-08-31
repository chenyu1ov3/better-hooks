import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { hrefFor, listDocuments, type DocumentRecord } from '../lib/content';
import { getApiEntryBySlug } from '../lib/hooks';
import { dictionaryFor } from '../lib/i18n';
import { jsonLdForDocument } from '../lib/metadata';
import { rehypeCodeFrameMetadata } from '../lib/rehype-code-frame-metadata';
import { siteConfig } from '../lib/site';
import { SHIKI_THEMES } from './code-block-config';
import proseStyles from './document-prose.module.css';
import { LiveExample } from './live-example';
import { createMdxComponents } from './mdx-components';
import { SiteLink } from './site-link';

export async function DocumentPage({ document }: { document: DocumentRecord }) {
  const dictionary = dictionaryFor(document.locale);
  const hook =
    document.slug[0] === 'hooks' && document.slug[1]
      ? getApiEntryBySlug(document.slug[1])
      : undefined;
  const mdxComponents = createMdxComponents({
    locale: document.locale,
    headings: document.headings,
  });
  const { content } = await compileMDX({
    source: document.source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: SHIKI_THEMES,
              keepBackground: false,
            },
          ],
          rehypeCodeFrameMetadata,
        ],
      },
    },
    components: hook
      ? {
          ...mdxComponents,
          HookExample: () => <LiveExample hook={hook} locale={document.locale} />,
        }
      : mdxComponents,
  });
  const documents = listDocuments(document.locale);
  const currentIndex = documents.findIndex(
    (item) => item.slug.join('/') === document.slug.join('/'),
  );
  const previous = currentIndex > 0 ? documents[currentIndex - 1] : null;
  const next = currentIndex >= 0 ? documents[currentIndex + 1] : null;
  const jsonLd = JSON.stringify(jsonLdForDocument(document)).replace(/</g, '\\u003c');

  return (
    <article className="min-w-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      {hook ? (
        <div
          className="mb-5 flex max-w-[72ch] flex-wrap gap-2"
          role="group"
          aria-label={document.locale === 'en' ? 'Hook metadata' : 'Hook 元数据'}
        >
          <span className="rounded-sm border border-border px-2 py-1 text-xs font-semibold text-foreground">
            {dictionary.categories[hook.category]}
          </span>
          <span className="rounded-sm border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
            {dictionary.common.clientOnly}
          </span>
        </div>
      ) : null}

      <div className={proseStyles.prose}>{content}</div>

      <div className="mt-12 flex w-full max-w-[72ch] justify-end">
        <a
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href={`${siteConfig.repositoryUrl}/edit/main/${document.sourcePath}`}
          target="_blank"
          rel="noreferrer"
        >
          {dictionary.docs.editPage}
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>

      <nav
        className="mt-7 grid w-full max-w-[72ch] grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2"
        aria-label={document.locale === 'en' ? 'Document pagination' : '文档翻页'}
      >
        {previous ? (
          <SiteLink
            className="group flex min-h-20 min-w-0 items-center gap-3 rounded-md border border-border p-4 transition-colors hover:border-foreground"
            href={hrefFor(document.locale, previous.slug)}
          >
            <ArrowLeft aria-hidden="true" size={15} />
            <span className="min-w-0 text-sm font-semibold">
              <small className="mb-1 block text-xs font-medium text-muted-foreground">
                {dictionary.docs.previous}
              </small>
              <span className="block truncate">{previous.title}</span>
            </span>
          </SiteLink>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
        {next ? (
          <SiteLink
            className="group flex min-h-20 min-w-0 items-center gap-3 rounded-md border border-border p-4 transition-colors hover:border-foreground sm:justify-end sm:text-right"
            href={hrefFor(document.locale, next.slug)}
          >
            <span className="min-w-0 text-sm font-semibold">
              <small className="mb-1 block text-xs font-medium text-muted-foreground">
                {dictionary.docs.next}
              </small>
              <span className="block truncate">{next.title}</span>
            </span>
            <ArrowRight aria-hidden="true" size={15} />
          </SiteLink>
        ) : null}
      </nav>
    </article>
  );
}
