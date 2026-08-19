import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { hrefFor } from '../lib/content';
import type { Locale } from '../lib/i18n';

export function NotFoundPage({ locale }: { locale: Locale }) {
  return (
    <main className="not-found page-container">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1>{locale === 'en' ? 'This route does not exist.' : '页面不存在'}</h1>
      <p>
        {locale === 'en'
          ? 'Return to the Hook explorer or open the documentation index.'
          : '你可以前往 Hook 索引，或从文档首页重新开始。'}
      </p>
      <Link className="button button--primary" href={hrefFor(locale, 'hooks')}>
        <ArrowLeft aria-hidden="true" size={16} />
        {locale === 'en' ? 'Browse hooks' : '查看 Hook'}
      </Link>
    </main>
  );
}
