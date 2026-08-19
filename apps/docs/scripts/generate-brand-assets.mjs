import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const docsRoot = resolve(import.meta.dirname, '..');
const publicRoot = resolve(docsRoot, 'public');
const geometry = JSON.parse(await readFile(resolve(docsRoot, 'lib', 'brand-mark.json'), 'utf8'));

const colors = {
  background: '#fafafa',
  border: '#d4d4d8',
  body: '#09090b',
  muted: '#52525b',
  primary: '#047857',
  surface: '#ffffff',
};

function markContents({ body = 'currentColor' } = {}) {
  return `
    <path d="${geometry.railPath}" fill="none" stroke="${body}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    <path d="${geometry.loopsPath}" fill="none" stroke="${body}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />`;
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.viewBox}" role="img" aria-labelledby="title desc">
  <title id="title">Better Hooks</title>
  <desc id="desc">An uppercase B formed by two connected Hook loops.</desc>
  <style>
    .structure { stroke: ${colors.body}; }
    @media (prefers-color-scheme: dark) {
      .structure { stroke: ${colors.background}; }
    }
  </style>
  <path class="structure" d="${geometry.railPath}" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  <path class="structure" d="${geometry.loopsPath}" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

await writeFile(resolve(publicRoot, 'better-hooks-mark.svg'), favicon, 'utf8');

const font = await readFile(
  resolve(
    docsRoot,
    'node_modules',
    '@fontsource-variable',
    'onest',
    'files',
    'onest-latin-wght-normal.woff2',
  ),
);
const fontUrl = `data:font/woff2;base64,${font.toString('base64')}`;
const largeMark = `<svg viewBox="${geometry.viewBox}" aria-hidden="true">${markContents({ body: colors.body })}</svg>`;
const smallMark = `<svg viewBox="${geometry.viewBox}" aria-hidden="true">${markContents({ body: colors.body })}</svg>`;

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face { font-family: Onest; src: url('${fontUrl}') format('woff2'); font-weight: 100 900; }
          * { box-sizing: border-box; }
          html, body { width: 1200px; height: 630px; margin: 0; overflow: hidden; }
          body { background: ${colors.background}; color: ${colors.body}; font-family: Onest, Arial, sans-serif; }
          .frame { position: relative; width: 100%; height: 100%; padding: 58px 72px 54px; }
          .top { height: 62px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${colors.border}; padding-bottom: 18px; }
          .lockup { display: flex; align-items: center; gap: 14px; font-size: 23px; font-weight: 780; }
          .lockup svg { width: 45px; height: 45px; }
          .release { border: 1px solid ${colors.border}; background: ${colors.surface}; padding: 8px 12px; color: ${colors.muted}; font-size: 14px; font-weight: 650; }
          .copy { position: absolute; left: 72px; top: 172px; width: 650px; }
          .eyebrow { margin: 0 0 18px; color: ${colors.primary}; font-size: 14px; font-weight: 780; }
          h1 { margin: 0; font-size: 70px; font-weight: 760; line-height: 1.08; }
          .description { margin: 24px 0 0; color: ${colors.muted}; font-size: 24px; line-height: 1.42; }
          .mark { position: absolute; top: 165px; right: 62px; width: 360px; height: 360px; }
          .footer { position: absolute; right: 72px; bottom: 54px; left: 72px; display: flex; justify-content: space-between; color: ${colors.muted}; font-size: 16px; }
        </style>
      </head>
      <body>
        <main class="frame">
          <header class="top">
            <div class="lockup">${smallMark}<span>BETTER HOOKS</span></div>
            <div class="release">REACT 19 / PREVIEW</div>
          </header>
          <section class="copy">
            <p class="eyebrow">TYPESCRIPT FIRST</p>
            <h1>Typed, composable<br />hooks for React 19.</h1>
            <p class="description">Predictable cleanup. Explicit runtime boundaries.</p>
          </section>
          <div class="mark">${largeMark}</div>
          <footer class="footer"><span>better-hook</span><span>github.com/chenyu1ov3/better-hooks</span></footer>
        </main>
      </body>
    </html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: resolve(publicRoot, 'opengraph-image.png'),
    type: 'png',
  });
} finally {
  await browser.close();
}

console.log('Generated Better Hooks favicon and Open Graph assets.');
