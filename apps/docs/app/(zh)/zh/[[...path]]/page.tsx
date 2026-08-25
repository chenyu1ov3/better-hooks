import type { Metadata } from 'next';
import { RouteView } from '../../../../components/route-view';
import { documentForPath, isProductRoute, staticPaths } from '../../../../lib/routes';
import { metadataForDocument, metadataForLocale, metadataForPage } from '../../../../lib/metadata';

type PageProps = { params: Promise<{ path?: string[] }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return staticPaths('zh-CN').map((path) => ({ path }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const path = (await params).path ?? [];
  if (!path.length) return metadataForLocale('zh-CN');
  const document = documentForPath('zh-CN', path);
  if (document) return metadataForDocument(document);
  if (path.length === 1 && isProductRoute(path[0])) {
    const metadata = {
      hooks: {
        title: 'Hook 索引',
        description: '按使用场景、分类或 TypeScript 签名查找 Hook，并查看完整的行为说明与源码。',
      },
      playground: {
        title: 'Hook 在线演练',
        description: '直接在浏览器中编辑并运行每个 Hook 的示例。',
      },
      changelog: {
        title: '更新日志',
        description: '按发布影响分类记录已发布 npm 包的变更。',
      },
    } as const;
    return metadataForPage({ locale: 'zh-CN', pathname: `/${path[0]}`, ...metadata[path[0]] });
  }
  return {};
}

export default async function ChinesePage({ params }: PageProps) {
  return <RouteView locale="zh-CN" path={(await params).path ?? []} />;
}
