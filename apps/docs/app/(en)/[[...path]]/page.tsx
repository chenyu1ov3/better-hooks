import type { Metadata } from 'next';
import { RouteView } from '../../../components/route-view';
import { documentForPath, isProductRoute, staticPaths } from '../../../lib/routes';
import { metadataForDocument, metadataForLocale, metadataForPage } from '../../../lib/metadata';

type PageProps = { params: Promise<{ path?: string[] }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return staticPaths('en').map((path) => ({ path }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const path = (await params).path ?? [];
  if (!path.length) return metadataForLocale('en');
  const document = documentForPath('en', path);
  if (document) return metadataForDocument(document);
  if (path.length === 1 && isProductRoute(path[0])) {
    const metadata = {
      hooks: {
        title: 'Hook index',
        description:
          'Search by behavior, category, or TypeScript signature. Every entry links to its runtime contract and source.',
      },
      playground: {
        title: 'Hook playground',
        description:
          'Edit and run every Hook example against the package built from this workspace.',
      },
      changelog: {
        title: 'Changelog',
        description:
          'Release notes will be published here when the first verified npm release is available.',
      },
    } as const;
    return metadataForPage({ locale: 'en', pathname: `/${path[0]}`, ...metadata[path[0]] });
  }
  return {};
}

export default async function EnglishPage({ params }: PageProps) {
  return <RouteView locale="en" path={(await params).path ?? []} />;
}
