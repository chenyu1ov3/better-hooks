import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const reviewScreenshotDirectory = resolve(tmpdir(), 'better-hooks-review-screenshots');

function reviewScreenshot(name: string) {
  return resolve(reviewScreenshotDirectory, name);
}

const viewports = [
  { width: 320, height: 568 },
  { width: 340, height: 640 },
  { width: 361, height: 640 },
  { width: 370, height: 640 },
  { width: 375, height: 667 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 667, height: 375 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const representativeViewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const keyPageRoutes = [
  { name: 'Hooks explorer', path: 'hooks' },
  { name: 'Playground', path: 'playground' },
  { name: 'Hook reference', path: 'hooks/use-debounce' },
] as const;

const defaultExampleText = {
  'use-toggle': 'Show details',
  'use-boolean': 'Hidden',
  'use-controllable-state': '0',
  'use-previous': '0 to 0',
  'use-latest': 'Report later',
  'use-debounce': 'Search',
  'use-throttle': 'Value',
  'use-debounce-fn': 'Save now',
  'use-throttle-fn': 'Move the pointer here.',
  'use-document-visibility': 'visible',
  'use-timeout': 'Saved successfully',
  'use-interval': /Pause at \d+/,
  'use-async': 'Ready',
  'use-event-listener': /\d+px/,
  'use-click-outside': 'Account settings',
  'use-hover': /Hovered|Move here/,
  'use-key-press': null,
  'use-lock-fn': 'Save',
  'use-memoized-fn': 'Greet',
  'use-media-query': /(?:Compact|Full) navigation/,
  'use-window-size': /\d+ x \d+/,
  'use-online': /Online|Offline/,
  'use-input': 'Ada',
  'use-local-storage': 'System',
  'use-session-storage': 'Discard',
  'use-is-mounted': 'idle',
  'use-isomorphic-layout-effect': /Measured width: \d+px/,
  'use-reset-state': 'Reset',
  'use-safe-state': /Count: 0/,
  'use-unmounted-ref': 'Waiting',
} as const;

function appRoute(path = '') {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const normalized = pathname.replace(/^\/+|\/+$/g, '');
  return `${normalized ? `./${normalized}/` : './'}${suffix}`;
}

async function openPage(page: Page, path = '') {
  const response = await page.goto(appRoute(path), { waitUntil: 'networkidle' });
  expect(response?.ok(), `Expected ${path || 'home'} to return a successful response`).toBe(true);
  await expect(page.locator('main')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const overflowers = Array.from(body.querySelectorAll<HTMLElement>('*'))
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          element: `${element.tagName.toLocaleLowerCase()}${element.id ? `#${element.id}` : ''}${
            element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''
          }`,
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
          width: Math.round(bounds.width),
        };
      })
      .filter(({ left, right, width }) => width > 0 && (left < -1 || right > viewportWidth + 1))
      .slice(0, 8);

    return {
      clientWidth: root.clientWidth,
      scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
      viewportWidth,
      overflowers,
    };
  });

  expect(
    dimensions.scrollWidth,
    `Horizontal overflow at ${dimensions.viewportWidth}px: ${JSON.stringify(dimensions.overflowers)}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectNextBandVisible(page: Page) {
  const dimensions = await page.locator('.home-categories').evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
    viewportHeight: window.innerHeight,
  }));

  expect(
    dimensions.top,
    `Category band is below the first viewport: ${JSON.stringify(dimensions)}`,
  ).toBeLessThan(dimensions.viewportHeight);
  expect(dimensions.bottom).toBeGreaterThan(0);
}

async function expectCompactProductSpacing(page: Page) {
  const dimensions = await page.locator('.product-page').evaluate((element) => {
    const intro = element.querySelector<HTMLElement>('.page-intro');
    const content = element.querySelector<HTMLElement>(
      '.hook-explorer, .playground-workbench, .release-row',
    );
    if (!intro || !content)
      throw new Error('Product page is missing its intro or primary content.');

    const pageBounds = element.getBoundingClientRect();
    const introBounds = intro.getBoundingClientRect();
    const contentBounds = content.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      paddingTop: Number.parseFloat(getComputedStyle(element).paddingTop),
      introOffset: introBounds.top - pageBounds.top,
      contentGap: contentBounds.top - introBounds.bottom,
    };
  });

  const maximum = dimensions.viewportWidth <= 820 ? 33 : 49;
  expect(dimensions.paddingTop).toBeGreaterThan(0);
  expect(dimensions.introOffset).toBeLessThanOrEqual(maximum);
  expect(dimensions.contentGap).toBeLessThanOrEqual(maximum);
}

async function expectWcagAa(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();
  const summary = results.violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(' ')}`)
          .join('\n')}`,
    )
    .join('\n\n');

  expect(results.violations, summary || 'No WCAG A/AA violations').toEqual([]);
}

test.describe('responsive layout', () => {
  for (const viewport of viewports) {
    test(`home has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openPage(page);
      await expect(page.getByRole('heading', { level: 1, name: 'Better Hooks' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNextBandVisible(page);
      if (viewport.width === 1440) {
        await page.screenshot({
          path: reviewScreenshot('home-en-1440x900.png'),
          animations: 'disabled',
        });
      }
      if (viewport.width === 320) {
        await page.screenshot({
          path: reviewScreenshot('home-en-320x568.png'),
          animations: 'disabled',
        });
      }
    });
  }

  test('mobile header controls retain 44px targets at the minimum width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openPage(page);
    const targets = page.locator(
      '.site-header .search-trigger, .site-header .language-link, .site-header .control-menu > summary, .site-header .mobile-menu-button',
    );

    await expect(targets).toHaveCount(4);
    const sizes = await targets.evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      }),
    );
    for (const size of sizes) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
  });

  for (const route of keyPageRoutes) {
    for (const viewport of representativeViewports) {
      test(`${route.name} has no horizontal overflow at the ${viewport.name} viewport`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await openPage(page, route.path);
        await expectNoHorizontalOverflow(page);
      });
    }
  }

  test('product pages keep compact intro and content spacing', async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const path of ['hooks', 'playground', 'changelog']) {
        await openPage(page, path);
        await expectCompactProductSpacing(page);
      }
    }
  });
});

test.describe('brand structure', () => {
  test('Hero title stays typographic and the header mark uses path-only geometry', async ({
    page,
  }) => {
    await openPage(page);

    const heroHeading = page.locator('.hero h1');
    await expect(heroHeading).toHaveText('Better Hooks');
    await expect(heroHeading.locator('svg')).toHaveCount(0);

    const mark = page.locator('.site-header .brand > svg.brand__mark');
    await expect(mark).toHaveCount(1);
    await expect(mark.locator('path')).toHaveCount(2);
    await expect(mark.locator('circle, rect')).toHaveCount(0);
  });

  test('Homepage uses the Hook animation without the legacy logo or commit loop', async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.getByTestId('hook-lifecycle-visual')).toBeVisible();
    await expect(page.locator('.hero__visual svg, .hero__visual .hero__mark')).toHaveCount(0);
    await expect(page.locator('.site-footer')).toBeVisible();
    await expect(page.locator('.commit-loop')).toHaveCount(0);
  });

  test('Homepage exposes install, API counts, category deep links, and real project links', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openPage(page);

    const install = page.locator('.hero__install');
    await expect(install.getByText('pnpm add better-hooks', { exact: true })).toBeVisible();
    await install.getByRole('button', { name: 'Copy install command' }).click();
    await expect(install.getByRole('button', { name: 'Install command copied' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('pnpm add better-hooks');

    await expect(page.getByRole('heading', { level: 2, name: '30 Hooks' })).toBeVisible();
    const categories = page.getByRole('navigation', { name: 'Hook categories' });
    await expect(categories.getByRole('link')).toHaveCount(6);
    await categories.getByRole('link', { name: /State 8 Hooks/ }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('state');
    await expect(page.getByRole('button', { name: 'State', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await expect(
      page.locator('.site-header').getByRole('link', { name: 'View on GitHub' }),
    ).toHaveAttribute('title', 'View on GitHub');
    await expect(page.locator('.site-footer').getByRole('link', { name: 'npm' })).toHaveAttribute(
      'href',
      'https://www.npmjs.com/package/better-hooks',
    );
  });

  test('Homepage removes preview and pseudo-star messaging', async ({ page }) => {
    await openPage(page);
    await expect(page.getByText('Preview', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Star', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Not yet published on npm', { exact: true })).toHaveCount(0);
  });
});

test.describe('core interactions', () => {
  test('global search opens with Ctrl+K and Cmd+K and navigates to a result', async ({ page }) => {
    await openPage(page);
    const dialog = page.locator('dialog.search-dialog');

    for (const shortcut of ['Control+K', 'Meta+K']) {
      await page.keyboard.press(shortcut);
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }

    await page.keyboard.press('Control+K');
    const searchbox = dialog.getByRole('combobox', { name: 'Search documentation' });
    await expect(searchbox).toHaveAttribute('aria-expanded', 'true');
    await searchbox.fill('useDebounce');
    const result = dialog.getByRole('option', { name: /useDebounce/ }).first();
    await expect(result).toBeVisible();
    await expect(searchbox).toHaveAttribute('aria-activedescendant', 'global-docs-search-option-0');
    await result.click();
    await expect(page).toHaveURL(/\/hooks\/use-debounce\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'useDebounce' })).toBeVisible();
  });

  test('theme choice applies immediately and survives reload', async ({ page }) => {
    await openPage(page);
    await page.locator('.control-menu > summary').click();
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const value = localStorage.getItem('better-hooks:prefs:v1');
          return value ? (JSON.parse(value) as { theme?: string }).theme : undefined;
        }),
      )
      .toBe('dark');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('.control-menu > summary').click();
    const dark = page.getByRole('radio', { name: 'Dark' });
    const system = page.getByRole('radio', { name: 'System' });
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await dark.focus();
    await page.keyboard.press('Home');
    await expect(system).toHaveAttribute('aria-checked', 'true');
    await expect(system).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await expect(dark).toBeFocused();
  });

  test('mobile navigation opens, closes, and follows internal links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page);
    const menuButton = page.getByRole('button', { name: 'Open menu' });
    const dialog = page.locator('dialog.mobile-menu');

    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close menu' }).click();
    await expect(dialog).toBeHidden();

    await menuButton.click();
    await dialog.getByRole('link', { name: 'Hooks', exact: true }).click();
    await expect(page).toHaveURL(/\/hooks\/$/);
    await expect(dialog).toBeHidden();
  });

  test('Hooks explorer filters results and restores URL state', async ({ page }) => {
    await openPage(page, 'hooks');
    const explorer = page.locator('.product-page .hook-explorer');
    const results = explorer.locator('.hook-result');

    await explorer.getByRole('button', { name: 'Async', exact: true }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    expect(await results.count()).toBeGreaterThan(0);
    for (const label of await results
      .locator('.hook-result__topline span:first-child')
      .allTextContents()) {
      expect(label).toBe('Async');
    }

    await explorer.getByRole('searchbox').fill('useAsync');
    await expect(results).toHaveCount(1);
    await expect(
      results.getByRole('link', { name: 'useAsync', exact: true }).first(),
    ).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(explorer.getByRole('searchbox')).toHaveValue('useAsync');
    await expect(results).toHaveCount(1);
  });

  test('Playground selector reads and updates the hook query parameter', async ({ page }) => {
    await openPage(page, 'playground?hook=use-throttle');
    await expect(page.getByText(/package built from this workspace/i)).toHaveCount(0);
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });

    await expect(selector).toHaveValue('use-throttle');
    await expect(playground.locator('.live-code-panel-heading')).toHaveText('useThrottle preview');

    await selector.selectOption('use-async');
    await expect.poll(() => new URL(page.url()).searchParams.get('hook')).toBe('use-async');
    await expect(playground.locator('.live-code-panel-heading')).toHaveText('useAsync preview');
  });

  test('Playground loads Hook modules only when selected', async ({ page }) => {
    const requestedHookChunks = new Set<string>();
    page.on('request', (request) => {
      const filename = new URL(request.url()).pathname.split('/').at(-1);
      if (filename?.startsWith('better-hooks-')) {
        requestedHookChunks.add(filename.replace(/\.[^.]+\.js$/, ''));
      }
    });

    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const preview = playground.locator('.live-code-preview__canvas');
    await expect(preview.getByText('Search', { exact: true })).toBeVisible();
    expect([...requestedHookChunks]).toEqual(['better-hooks-use-debounce']);

    await playground.getByRole('combobox', { name: 'Example' }).selectOption('use-async');
    await expect(preview.getByText('Ready', { exact: true })).toBeVisible();
    expect([...requestedHookChunks]).toEqual([
      'better-hooks-use-debounce',
      'better-hooks-use-async',
    ]);
  });

  test('Playground reports a Hook chunk failure without discarding the editor', async ({
    page,
  }) => {
    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });
    await expect(playground.locator('.live-code-preview__canvas')).toContainText('Search');

    await page.route('**/better-hooks-use-async.*.js', (route) => route.abort());
    await selector.selectOption('use-async');
    await expect(playground.getByRole('alert')).toContainText(
      'Unable to load module "better-hooks/use-async"',
    );
    await expect(
      playground.getByRole('textbox', { name: 'Editable TSX', exact: true }),
    ).toContainText("from 'better-hooks/use-async'");

    await page.unroute('**/better-hooks-use-async.*.js');
    await selector.selectOption('use-debounce');
    await selector.selectOption('use-async');
    await expect(playground.locator('.live-code-preview__canvas')).toContainText('Ready');
    await expect(playground.getByRole('alert')).toHaveCount(0);
  });

  test('Hook example edits its preview, reports errors, copies, and resets', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await openPage(page, 'hooks/use-debounce');
    const workbench = page.locator('.live-example .live-code-workbench');
    const preview = workbench.locator('.live-code-preview__canvas');

    await expect(preview.getByText('Search', { exact: true })).toBeVisible();
    await workbench.getByRole('button', { name: 'Edit code' }).click();

    const editor = workbench.getByRole('textbox', { name: 'Editable TSX', exact: true });
    const reset = workbench.getByRole('button', { name: 'Reset example' });
    await expect(editor).toHaveAttribute('contenteditable', /^(?:true|plaintext-only)$/);
    await expect(editor).toContainText("from 'better-hooks/use-debounce'");

    await editor.fill(`export function SearchPreview() {
  return <output>Edited preview</output>;
}`);
    await editor.press('ArrowRight');
    await expect(preview.getByText('Edited preview', { exact: true })).toBeVisible();
    await expect(reset).toBeEnabled();

    await workbench.getByRole('button', { name: 'Copy', exact: true }).click();
    await expect(workbench.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('Edited preview');

    await editor.fill(`import { nope } from 'left-pad';

export function BrokenExample() {
  return <p>Broken</p>;
}`);
    await editor.press('ArrowRight');
    await expect(workbench.getByRole('alert')).toContainText('Unsupported import "left-pad"');

    await reset.click();
    await expect(workbench.getByRole('alert')).toHaveCount(0);
    await expect(editor).toContainText("from 'better-hooks/use-debounce'");
    await expect(preview.getByText('Search', { exact: true })).toBeVisible();
    await expect(reset).toBeDisabled();
  });

  test('All 30 default Playground examples compile and render', async ({ page }) => {
    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });
    const options = await selector.locator('option').evaluateAll((elements) =>
      elements.map((element) => ({
        label: element.textContent?.trim() ?? '',
        value: (element as HTMLOptionElement).value,
      })),
    );

    expect(options).toHaveLength(30);
    expect(options.map(({ value }) => value).sort()).toEqual(
      Object.keys(defaultExampleText).sort(),
    );

    for (const { label, value } of options) {
      await selector.selectOption(value);
      await expect(playground.locator('.live-code-panel-heading')).toHaveText(`${label} preview`);
      await expect(
        playground.getByRole('textbox', { name: 'Editable TSX', exact: true }),
      ).toContainText(`better-hooks/${value}`);
      const expectedText = defaultExampleText[value as keyof typeof defaultExampleText];
      if (expectedText !== null) {
        await expect(playground.locator('.live-code-preview__canvas')).toContainText(expectedText);
      }
      await expect(playground.getByRole('alert')).toHaveCount(0);
    }
  });

  test('language switch preserves the documentation route and updates html lang', async ({
    page,
  }) => {
    await openPage(page, 'docs/getting-started');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.locator('.language-link').click();
    await expect(page).toHaveURL(/\/zh\/docs\/getting-started\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await page.locator('.language-link').click();
    await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('language switch preserves Hook Explorer filters and the page hash', async ({ page }) => {
    await openPage(page, 'hooks');
    const explorer = page.locator('.product-page .hook-explorer');

    await explorer.getByRole('button', { name: 'Async', exact: true }).click();
    await explorer.getByRole('searchbox').fill('useAsync');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await page.evaluate(() => {
      window.location.hash = 'main-content';
    });
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');

    await page.locator('.language-link').click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/\/zh\/hooks\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');
    await expect(explorer.getByRole('searchbox')).toHaveValue('useAsync');

    await page.locator('.language-link').click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/\/hooks\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');
  });
});

test.describe('documentation navigation', () => {
  test('Removed routes and sitemap entries stay unavailable', async ({ page, request }) => {
    await openPage(page);
    await expect(
      page.locator('.site-header').getByRole('link', { name: 'Examples', exact: true }),
    ).toHaveCount(0);

    for (const path of ['examples', 'zh/examples', 'hooks/use-storage', 'zh/hooks/use-storage']) {
      const response = await request.get(appRoute(path));
      expect(response.status(), `Expected /${path}/ to return 404`).toBe(404);
    }

    const sitemapResponse = await request.get('./sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    expect(await sitemapResponse.text()).not.toContain('/examples/');
  });

  test('Architecture decision records are archived outside the public docs', async ({
    page,
    request,
  }) => {
    await openPage(page, 'docs');
    const navigationText = (await page.locator('.docs-navigation').allTextContents()).join(' ');
    expect(navigationText).not.toContain('Architecture decisions');
    expect(navigationText).not.toContain('架构决策记录');

    await page.keyboard.press('Control+K');
    const searchDialog = page.locator('dialog.search-dialog');
    const searchbox = searchDialog.getByRole('combobox', { name: 'Search documentation' });
    await searchbox.fill('ADR 001');
    await expect(searchDialog.getByText('No results found.', { exact: true })).toBeVisible();
    await searchDialog.getByRole('button', { name: 'Close menu' }).click();
    await expect(searchDialog).toBeHidden();

    for (const path of [
      'docs/architecture/adr/001-boundaries',
      'zh/docs/architecture/adr/001-boundaries',
    ]) {
      const response = await request.get(appRoute(path));
      expect(response.status(), `Expected /${path}/ to return 404`).toBe(404);
    }

    const sitemapResponse = await request.get('./sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).not.toContain('/docs/architecture/adr/');
    expect(sitemap).not.toContain('/zh/docs/architecture/adr/');

    await page.locator('.language-link').click();
    await expect(page).toHaveURL(/\/zh\/docs\/$/);
    await page.keyboard.press('Control+K');
    const chineseSearch = page.locator('dialog.search-dialog');
    const chineseSearchbox = chineseSearch.getByRole('combobox', { name: '搜索文档' });
    await chineseSearchbox.fill('架构决策');
    await expect(chineseSearch.getByText('没有找到匹配内容。', { exact: true })).toBeVisible();
  });

  test('Core concept pages describe lifecycle and runtime contracts in both locales', async ({
    page,
  }) => {
    await openPage(page, 'docs/react-19');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Actions stay usable across renders' }),
    ).toBeVisible();
    await expect(page.locator('.prose-doc')).toContainText('Errors remain observable');

    await page.locator('.language-link').click();
    await expect(
      page.getByRole('heading', { level: 2, name: '操作函数跨渲染保持可用' }),
    ).toBeVisible();
    await expect(page.locator('.prose-doc')).toContainText('错误保持可观察');

    await openPage(page, 'zh/docs/ssr-rsc');
    await expect(
      page.getByRole('heading', { level: 2, name: '在调用 Hook 的位置设置边界' }),
    ).toBeVisible();
    await expect(page.locator('.prose-doc')).toContainText('选择确定的服务端快照');
  });

  test('document labels are meaningful and useKeyPress documents the frozen chord contract', async ({
    page,
  }) => {
    await openPage(page, 'docs/getting-started');
    await expect(page.locator('.doc-kicker')).toHaveCount(0);

    await openPage(page, 'hooks/use-key-press');
    await expect(page.locator('.doc-kicker')).toContainText('Browser & DOM');
    await expect(page.locator('.doc-kicker')).toContainText('Client Component');
    await expect(page.locator('.prose-doc')).toContainText(
      'Arrays always represent independent alternatives',
    );
    await expect(page.locator('.prose-doc')).toContainText("'ctrl+s'");

    await page.locator('.language-link').click();
    await expect(page.locator('.prose-doc')).toContainText('数组始终表示彼此独立的候选项');
    await expect(page.locator('.prose-doc')).toContainText("'ctrl+s'");
  });

  test('Changelog renders the package version and release data in both languages', async ({
    page,
  }) => {
    await openPage(page, 'changelog');
    const versionHeading = page.getByRole('heading', { level: 2 });
    await expect(versionHeading).toHaveText(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    const version = (await versionHeading.textContent())?.trim();
    expect(version).toBeTruthy();
    await expect(page.locator('.release-notes h3')).toHaveCount(2);
    await expect(
      page.getByRole('link', { name: new RegExp(`View this version on npm: ${version}`) }),
    ).toHaveAttribute('href', `https://www.npmjs.com/package/better-hooks/v/${version}`);
    await expect(page.getByRole('link', { name: 'GitHub Release' })).toHaveAttribute(
      'href',
      `https://github.com/chenyu1ov3/better-hooks/releases/tag/better-hooks@${version}`,
    );
    await expect(page.getByText('Not yet published on npm', { exact: true })).toHaveCount(0);

    await page.locator('.language-link').click();
    await expect(page).toHaveURL(/\/zh\/changelog\/$/);
    await expect(page.getByRole('heading', { level: 2, name: version! })).toBeVisible();
    await expect(page.locator('.release-notes h3')).toHaveCount(2);
    await expect(
      page.getByRole('link', { name: new RegExp(`在 npm 查看此版本: ${version}`) }),
    ).toHaveAttribute('href', `https://www.npmjs.com/package/better-hooks/v/${version}`);
    await expect(page.getByRole('link', { name: 'GitHub Release' })).toHaveAttribute(
      'href',
      `https://github.com/chenyu1ov3/better-hooks/releases/tag/better-hooks@${version}`,
    );
  });

  test('desktop documentation shows a linked table of contents', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, 'docs/getting-started');
    const tableOfContents = page.locator('aside.toc');
    const firstLink = tableOfContents.locator('nav a').first();

    await expect(tableOfContents).toBeVisible();
    await expect(page.locator('details.toc-mobile')).toBeHidden();
    await expect(firstLink).toBeVisible();
    const target = await firstLink.getAttribute('href');
    expect(target).toMatch(/^#/);
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target!)).toBeVisible();
  });

  test('mobile documentation exposes the TOC and docs drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, 'docs/getting-started');
    const mobileToc = page.locator('details.toc-mobile');

    await expect(page.locator('aside.toc')).toBeHidden();
    await expect(mobileToc).toBeVisible();
    await mobileToc.locator('summary').click();
    await expect(mobileToc.locator('nav a').first()).toBeVisible();

    const docsMenu = page.locator('.mobile-docs-nav');
    await docsMenu.getByRole('button', { name: 'Docs', exact: true }).click();
    const dialog = docsMenu.locator('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: 'Getting started', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await dialog.getByRole('button', { name: 'Close menu' }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe('WCAG A/AA', () => {
  const routes = [
    { path: '', name: 'home', viewport: { width: 1280, height: 800 } },
    { path: 'hooks', name: 'Hooks explorer', viewport: { width: 1280, height: 800 } },
    {
      path: 'hooks/use-debounce',
      name: 'Hook reference',
      viewport: { width: 1280, height: 800 },
      screenshot: 'hook-use-debounce-en-1280x800.png',
    },
    { path: 'playground', name: 'Playground', viewport: { width: 1280, height: 800 } },
    { path: 'changelog', name: 'changelog', viewport: { width: 1280, height: 800 } },
    {
      path: 'docs/getting-started',
      name: 'documentation',
      viewport: { width: 1280, height: 800 },
    },
    {
      path: 'zh',
      name: 'Chinese home',
      viewport: { width: 390, height: 844 },
      screenshot: 'home-zh-390x844.png',
    },
  ] as const;

  for (const route of routes) {
    test(`${route.name} has no automated WCAG A/AA violations`, async ({ page }) => {
      await page.setViewportSize(route.viewport);
      await openPage(page, route.path);
      await expectWcagAa(page);
      if ('screenshot' in route) {
        await page.screenshot({
          path: reviewScreenshot(route.screenshot),
          animations: 'disabled',
        });
      }
    });
  }

  test('mobile documentation has no automated WCAG A/AA violations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, 'docs/getting-started');
    await expectWcagAa(page);
  });

  test('home has no automated WCAG A/AA violations in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openPage(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectWcagAa(page);
    await page.screenshot({
      path: reviewScreenshot('home-en-dark-1280x800.png'),
      animations: 'disabled',
    });
  });
});

test('reduced motion removes long-running CSS motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPage(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  const longRunningAnimations = await page.evaluate(() =>
    document.getAnimations().flatMap((animation) => {
      const timing = animation.effect?.getComputedTiming();
      const duration =
        typeof timing?.duration === 'number' ? timing.duration : Number.POSITIVE_INFINITY;
      return animation.playState === 'running' && duration > 100
        ? [{ duration, playState: animation.playState }]
        : [];
    }),
  );

  expect(longRunningAnimations).toEqual([]);
  await expect(page.locator('.commit-loop')).toHaveCount(0);
});
