import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hrefFor } from '../lib/content';
import type { Locale } from '../lib/i18n';
import { SiteLink } from './site-link';

export function NotFoundPage({ locale }: { locale: Locale }) {
  return (
    <main className="page-container flex min-h-[calc(100svh-var(--header-height))] flex-col items-start justify-center py-16">
      <p className="m-0 text-xs font-bold text-brand uppercase">404 / NOT FOUND</p>
      <h1 className="mt-3 max-w-[18ch] text-4xl leading-tight font-bold text-balance text-foreground md:text-5xl">
        {locale === 'en' ? 'This route does not exist.' : '页面不存在'}
      </h1>
      <p className="mt-4 max-w-[58ch] text-base leading-7 text-pretty text-muted-foreground">
        {locale === 'en'
          ? 'Return to the Hook explorer or open the documentation index.'
          : '你可以前往 Hook 索引，或从文档首页重新开始。'}
      </p>
      <Button asChild size="lg" className="mt-6 min-h-11">
        <SiteLink href={hrefFor(locale, 'hooks')}>
          <ArrowLeft aria-hidden="true" size={16} />
          {locale === 'en' ? 'Browse hooks' : '查看 Hook'}
        </SiteLink>
      </Button>
    </main>
  );
}
