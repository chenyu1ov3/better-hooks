import { readExampleSource } from '../lib/examples';
import { apiEntries } from '../lib/hooks';
import type { Locale } from '../lib/i18n';
import { InteractivePlayground, type PlaygroundEntry } from './interactive-playground';

export function Playground({ locale }: { locale: Locale }) {
  const entries: PlaygroundEntry[] = apiEntries.map((hook) => {
    const source = readExampleSource(hook.slug, locale);
    if (!source) throw new Error(`Missing ${locale} example source for ${hook.slug}.`);
    return {
      code: source.code,
      name: hook.name,
      slug: hook.slug,
      sourceUrl: source.sourceUrl,
    };
  });

  return <InteractivePlayground entries={entries} locale={locale} />;
}
