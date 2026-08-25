import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { hrefFor, listDocuments, type DocumentRecord } from '../lib/content';
import { getApiEntryBySlug } from '../lib/hooks';
import { dictionaryFor } from '../lib/i18n';
import { jsonLdForDocument } from '../lib/metadata';
import { siteConfig } from '../lib/site';
import { LiveExample } from './live-example';
import { mdxComponents } from './mdx-components';

export async function DocumentPage({ document }: { document: DocumentRecord }) {
  const dictionary = dictionaryFor(document.locale);
  const hook =
    document.slug[0] === 'hooks' && document.slug[1]
      ? getApiEntryBySlug(document.slug[1])
      : undefined;
  const { content } = await compileMDX({
    source: document.source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: { light: 'github-light-default', dark: 'github-dark-default' },
              keepBackground: false,
            },
          ],
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
  const contentPath =
    document.slug.length === 1 && document.slug[0] === 'docs'
      ? 'docs/index.mdx'
      : `${document.slug.join('/')}.mdx`;

  return (
    <article className="prose-doc">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      {hook ? (
        <div className="doc-kicker">
          <span>{dictionary.categories[hook.category]}</span>
          <span>{dictionary.common.clientOnly}</span>
        </div>
      ) : null}
      {content}
      <div className="document-actions">
        <a
          href={`${siteConfig.repositoryUrl}/edit/main/apps/docs/content/${document.locale}/${contentPath}`}
          target="_blank"
          rel="noreferrer"
        >
          {dictionary.docs.editPage}
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>
      <nav
        className="document-pagination"
        aria-label={document.locale === 'en' ? 'Document pagination' : '文档翻页'}
      >
        {previous ? (
          <Link href={hrefFor(document.locale, previous.slug)}>
            <ArrowLeft aria-hidden="true" size={15} />
            <span>
              <small>{dictionary.docs.previous}</small>
              {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={hrefFor(document.locale, next.slug)}>
            <span>
              <small>{dictionary.docs.next}</small>
              {next.title}
            </span>
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
