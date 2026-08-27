import { createHash } from 'node:crypto';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const tarBlockSize = 512;

export function readTarGzip(tarball) {
  const archive = gunzipSync(tarball);
  const files = new Map();

  for (let offset = 0; offset + tarBlockSize <= archive.length;) {
    const header = archive.subarray(offset, offset + tarBlockSize);
    if (header.every((byte) => byte === 0)) break;

    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const filename = prefix ? `${prefix}/${name}` : name;
    assertSafeTarPath(filename);

    const sizeText = readTarString(header, 124, 12).trim() || '0';
    const size = Number.parseInt(sizeText, 8);
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new Error(`Tar entry ${filename} has an invalid size ${JSON.stringify(sizeText)}.`);
    }

    const bodyStart = offset + tarBlockSize;
    const bodyEnd = bodyStart + size;
    if (bodyEnd > archive.length) throw new Error(`Tar entry ${filename} is truncated.`);

    const type = String.fromCharCode(header[156] || 48);
    if (type === '0' || type === '\0') {
      if (files.has(filename)) throw new Error(`Tar archive contains duplicate file ${filename}.`);
      files.set(filename, archive.subarray(bodyStart, bodyEnd));
    }
    offset = bodyStart + Math.ceil(size / tarBlockSize) * tarBlockSize;
  }

  return files;
}

export function sri(bytes) {
  return `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function assertSafeTarPath(filename) {
  if (
    !filename ||
    path.posix.isAbsolute(filename) ||
    filename.split('/').some((segment) => segment === '..')
  ) {
    throw new Error(`Tar archive contains unsafe path ${JSON.stringify(filename)}.`);
  }
}

function readTarString(buffer, start, length) {
  const end = buffer.indexOf(0, start);
  return buffer
    .subarray(start, end === -1 || end > start + length ? start + length : end)
    .toString();
}
