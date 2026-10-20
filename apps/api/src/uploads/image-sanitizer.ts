/**
 * Dependency-free image validation and metadata stripping.
 *
 * Uploaded photos often carry EXIF/XMP blocks with the GPS position and device
 * details of the person who took them. We detect the real format from the file's
 * bytes (never the extension or client MIME type), read its dimensions, and drop
 * metadata containers before the file is stored.
 */
export type ImageKind = 'jpeg' | 'png' | 'webp';

export const IMAGE_MIME: Record<ImageKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8000;

export class ImageValidationError extends Error {}

export function detectImageKind(buf: Buffer): ImageKind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return 'jpeg';
  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  return null;
}

export interface SanitizedImage {
  kind: ImageKind;
  mime: string;
  width: number;
  height: number;
  data: Buffer;
}

export function sanitizeImage(input: Buffer): SanitizedImage {
  if (!input.length) throw new ImageValidationError('The file is empty.');
  if (input.length > MAX_IMAGE_BYTES)
    throw new ImageValidationError('Images must be 5 MB or smaller.');
  const kind = detectImageKind(input);
  if (!kind)
    throw new ImageValidationError(
      'Only JPEG, PNG or WebP images are accepted.',
    );

  const result =
    kind === 'jpeg'
      ? stripJpeg(input)
      : kind === 'png'
        ? stripPng(input)
        : stripWebp(input);

  if (!result.width || !result.height)
    throw new ImageValidationError('The image could not be read.');
  if (
    result.width > MAX_IMAGE_DIMENSION ||
    result.height > MAX_IMAGE_DIMENSION
  ) {
    throw new ImageValidationError(
      `Images must be at most ${MAX_IMAGE_DIMENSION}px on each side.`,
    );
  }
  return { kind, mime: IMAGE_MIME[kind], ...result };
}

interface Stripped {
  width: number;
  height: number;
  data: Buffer;
}

// --- JPEG -------------------------------------------------------------------
// Keep APP0 (JFIF), APP2 (ICC colour profile) and APP14 (Adobe colour transform);
// drop APP1 (EXIF/XMP), all other APPn blocks and comments.
const JPEG_KEEP_APP = new Set([0xe0, 0xe2, 0xee]);
const JPEG_SOF = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function stripJpeg(buf: Buffer): Stripped {
  const out: Buffer[] = [buf.subarray(0, 2)];
  let offset = 2;
  let width = 0;
  let height = 0;

  while (offset < buf.length) {
    if (buf[offset] !== 0xff)
      throw new ImageValidationError('Corrupted JPEG file.');
    const marker = buf[offset + 1];
    if (marker === 0xff) {
      offset += 1; // fill byte
      continue;
    }
    if (marker === 0xd9) {
      out.push(buf.subarray(offset, offset + 2));
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(buf.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }
    if (offset + 4 > buf.length)
      throw new ImageValidationError('Corrupted JPEG file.');
    const length = buf.readUInt16BE(offset + 2);
    const end = offset + 2 + length;
    if (length < 2 || end > buf.length)
      throw new ImageValidationError('Corrupted JPEG file.');

    if (JPEG_SOF.has(marker) && length >= 7) {
      height = buf.readUInt16BE(offset + 5);
      width = buf.readUInt16BE(offset + 7);
    }

    if (marker === 0xda) {
      // Start of scan: the rest is entropy-coded image data.
      out.push(buf.subarray(offset));
      break;
    }

    const isApp = marker >= 0xe0 && marker <= 0xef;
    const isComment = marker === 0xfe;
    if (!(isApp && !JPEG_KEEP_APP.has(marker)) && !isComment) {
      out.push(buf.subarray(offset, end));
    }
    offset = end;
  }
  return { width, height, data: Buffer.concat(out) };
}

// --- PNG --------------------------------------------------------------------
const PNG_DROP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);

function stripPng(buf: Buffer): Stripped {
  const out: Buffer[] = [buf.subarray(0, 8)];
  let offset = 8;
  let width = 0;
  let height = 0;
  while (offset + 12 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > buf.length) throw new ImageValidationError('Corrupted PNG file.');
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
    }
    if (!PNG_DROP.has(type)) out.push(buf.subarray(offset, end));
    offset = end;
    if (type === 'IEND') break;
  }
  return { width, height, data: Buffer.concat(out) };
}

// --- WebP -------------------------------------------------------------------
function stripWebp(buf: Buffer): Stripped {
  const chunks: Buffer[] = [];
  let offset = 12;
  let width = 0;
  let height = 0;
  let vp8xIndex = -1;

  while (offset + 8 <= buf.length) {
    const type = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size % 2);
    if (offset + 8 + size > buf.length)
      throw new ImageValidationError('Corrupted WebP file.');
    const body = offset + 8;

    if (type === 'VP8X' && size >= 10) {
      width = 1 + buf.readUIntLE(body + 4, 3);
      height = 1 + buf.readUIntLE(body + 7, 3);
    } else if (type === 'VP8 ' && size >= 10 && !width) {
      width = buf.readUInt16LE(body + 6) & 0x3fff;
      height = buf.readUInt16LE(body + 8) & 0x3fff;
    } else if (type === 'VP8L' && size >= 5 && !width) {
      const bits = buf.readUInt32LE(body + 1);
      width = (bits & 0x3fff) + 1;
      height = ((bits >> 14) & 0x3fff) + 1;
    }

    if (type !== 'EXIF' && type !== 'XMP ') {
      if (type === 'VP8X') vp8xIndex = chunks.length;
      chunks.push(Buffer.from(buf.subarray(offset, Math.min(end, buf.length))));
    }
    offset = end;
  }

  if (vp8xIndex >= 0) {
    // Clear the EXIF (bit 3) and XMP (bit 2) presence flags.
    chunks[vp8xIndex][8] &= ~(0x08 | 0x04);
  }
  const payload = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(payload.length + 4, 4);
  header.write('WEBP', 8, 'ascii');
  return { width, height, data: Buffer.concat([header, payload]) };
}
