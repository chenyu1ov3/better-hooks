import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

const root = path.resolve(process.argv[2] ?? '.');
const packageDirectory = path.join(root, 'packages/hooks');
const sourceDirectory = path.join(packageDirectory, 'src');
const manifest = JSON.parse(await readFile(path.join(packageDirectory, 'package.json'), 'utf8'));
const entries = Object.keys(manifest.exports ?? {})
  .filter((entry) => entry.startsWith('./use-'))
  .map((entry) => entry.slice(2))
  .sort();
const failures = [];
const extracted = [];

for (const entry of entries) {
  const examplesDirectory = path.join(sourceDirectory, entry, 'examples');
  let files = [];
  try {
    files = await readdir(examplesDirectory);
  } catch {
    failures.push(`${entry}: examples directory is missing`);
    continue;
  }

  const expectedFiles = new Set(['basic.md', 'basic.zh-CN.md']);
  for (const file of files) {
    if (!expectedFiles.has(file)) {
      failures.push(
        `${entry}: unexpected example file ${file}; each entry must contain only basic.md and basic.zh-CN.md`,
      );
    }
  }

  for (const locale of ['en', 'zh-CN']) {
    const filename = locale === 'en' ? 'basic.md' : 'basic.zh-CN.md';
    const file = path.join(examplesDirectory, filename);
    let source;
    try {
      const bytes = await readFile(file);
      source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (error) {
      failures.push(`${entry}/${filename}: ${formatError(error)}`);
      continue;
    }

    const tree = unified().use(remarkParse).parse(source);
    const headings = [];
    const codeBlocks = [];
    let hasIntroduction = false;
    let reachedSection = false;
    let sawTitle = false;

    visit(tree, (node) => {
      if (node.type === 'heading') {
        const value = textContent(node);
        headings.push({ depth: node.depth, value });
        if (node.depth === 1 && headings.length === 1) sawTitle = true;
        if (node.depth === 2) reachedSection = true;
      } else if (
        node.type === 'paragraph' &&
        sawTitle &&
        !reachedSection &&
        textContent(node).trim().length > 0
      ) {
        hasIntroduction = true;
      } else if (node.type === 'code' && node.lang === 'tsx') {
        codeBlocks.push(node.value);
      }
    });

    if (headings[0]?.depth !== 1 || headings[0].value.trim() !== entry) {
      failures.push(`${entry}/${filename}: first heading must name ${entry}`);
    }
    if (!hasIntroduction) failures.push(`${entry}/${filename}: introduction is missing`);

    const requiredSections = locale === 'en' ? ['Example', 'Behavior'] : ['示例', '行为说明'];
    for (const section of requiredSections) {
      if (!headings.some((heading) => heading.depth === 2 && heading.value === section)) {
        failures.push(`${entry}/${filename}: "${section}" section is missing`);
      }
    }
    if (codeBlocks.length !== 1) {
      failures.push(
        `${entry}/${filename}: expected exactly one tsx example, found ${codeBlocks.length}`,
      );
    }

    for (const [index, code] of codeBlocks.entries()) {
      const sourceFile = ts.createSourceFile(
        `${entry}-${locale}-${index}.tsx`,
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const firstStatement = sourceFile.statements[0];
      const hasClientDirective =
        firstStatement?.kind === ts.SyntaxKind.ExpressionStatement &&
        ts.isStringLiteral(firstStatement.expression) &&
        firstStatement.expression.text === 'use client';
      if (!hasClientDirective) {
        failures.push(`${entry}/${filename}: tsx example must include 'use client'`);
      }
      const imports = sourceFile.statements.filter(ts.isImportDeclaration);
      const directEntry = `better-hooks/${entry}`;
      const hasDirectImport = imports.some(
        (statement) =>
          ts.isStringLiteral(statement.moduleSpecifier) &&
          statement.moduleSpecifier.text === directEntry,
      );
      if (!hasDirectImport) {
        failures.push(`${entry}/${filename}: use the direct ${directEntry} entry`);
      }
      for (const statement of imports) {
        const specifier = ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : '';
        if (specifier !== 'react' && specifier !== directEntry) {
          failures.push(
            `${entry}/${filename}: unsupported import ${JSON.stringify(specifier)}; only react and ${directEntry} are allowed`,
          );
        }
      }

      const exportedStatements = sourceFile.statements.filter(
        (statement) =>
          ts.canHaveModifiers(statement) &&
          ts
            .getModifiers(statement)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      );
      const component = exportedStatements.length === 1 ? exportedStatements[0] : undefined;
      if (
        !component ||
        !ts.isFunctionDeclaration(component) ||
        !component.name ||
        !/^[A-Z]/.test(component.name.text)
      ) {
        failures.push(
          `${entry}/${filename}: tsx example must export exactly one named function component`,
        );
      }
      extracted.push({ code, name: `${entry}-${locale}-${index}.tsx` });
    }
  }
}

if (extracted.length > 0) await typecheckExamples(extracted);

if (failures.length > 0) {
  console.error(
    ['Hook example checks failed:', ...failures.map((failure) => `- ${failure}`)].join('\n'),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${entries.length} bilingual Hook examples and ${extracted.length} TSX blocks.`,
  );
}

async function typecheckExamples(examples) {
  const tempDirectory = await mkdtemp(path.join(packageDirectory, '.hook-examples-'));

  try {
    const exampleFiles = [];
    for (const example of examples) {
      const file = path.join(tempDirectory, example.name);
      await writeFile(file, `${example.code}\n`, 'utf8');
      exampleFiles.push(file);
    }

    const configPath = path.join(packageDirectory, 'tsconfig.json');
    const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
    if (loaded.error) {
      failures.push(formatDiagnostic(loaded.error));
      return;
    }
    const parsed = ts.parseJsonConfigFileContent(
      loaded.config,
      ts.sys,
      packageDirectory,
      {
        composite: false,
        incremental: false,
        // Examples are application code; declaration-only constraints do not apply.
        isolatedDeclarations: false,
        noEmit: true,
      },
      configPath,
    );
    const program = ts.createProgram({
      rootNames: [...parsed.fileNames, ...exampleFiles],
      options: parsed.options,
    });
    for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
      failures.push(formatDiagnostic(diagnostic));
    }
  } finally {
    await rm(tempDirectory, { force: true, recursive: true });
  }
}

function textContent(node) {
  if ('value' in node && typeof node.value === 'string') return node.value;
  if (!('children' in node) || !Array.isArray(node.children)) return '';
  return node.children.map(textContent).join('');
}

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (!diagnostic.file || diagnostic.start === undefined) return message;
  const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  return `${path.relative(root, diagnostic.file.fileName)}:${position.line + 1}:${position.character + 1} ${message}`;
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
