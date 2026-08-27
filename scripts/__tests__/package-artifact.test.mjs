import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { canonicalJson, readTarGzip, sha256, sri } from '../package-artifact.mjs';

function createTar(entries) {
  const blocks = [];
  for (const [filename, source] of entries) {
    const body = Buffer.from(source);
    const header = Buffer.alloc(512);
    header.write(filename, 0, 100, 'utf8');
    header.write(`${body.length.toString(8).padStart(11, '0')}\0`, 124, 12, 'ascii');
    header[156] = '0'.codePointAt(0);
    blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

describe('package artifact helpers', () => {
  it('reads regular files from a gzipped tar archive', () => {
    const files = readTarGzip(
      createTar([
        ['package/package.json', '{"name":"better-hooks"}'],
        ['package/dist/index.js', "'use client';\n"],
      ]),
    );

    expect([...files.keys()]).toEqual(['package/package.json', 'package/dist/index.js']);
    expect(files.get('package/dist/index.js')?.toString()).toBe("'use client';\n");
  });

  it('rejects unsafe and duplicate paths', () => {
    expect(() => readTarGzip(createTar([['../outside.txt', 'bad']]))).toThrow('unsafe path');
    expect(() =>
      readTarGzip(
        createTar([
          ['package/index.js', 'first'],
          ['package/index.js', 'second'],
        ]),
      ),
    ).toThrow('duplicate file');
  });

  it('produces stable integrity and canonical metadata values', () => {
    const bytes = Buffer.from('better-hooks');
    expect(sri(bytes)).toMatch(/^sha512-/u);
    expect(sha256(bytes)).toHaveLength(64);
    expect(canonicalJson({ z: 1, nested: { b: 2, a: 1 } })).toBe('{"nested":{"a":1,"b":2},"z":1}');
  });
});
