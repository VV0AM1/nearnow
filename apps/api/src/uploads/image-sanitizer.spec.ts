import {
  detectImageKind,
  ImageValidationError,
  sanitizeImage,
} from './image-sanitizer';
import { tinyJpeg, tinyPng } from '../../test/fixtures/images';

describe('image sanitizer', () => {
  it('detects real formats from bytes, not names', () => {
    expect(detectImageKind(tinyPng())).toBe('png');
    expect(detectImageKind(tinyJpeg())).toBe('jpeg');
    expect(detectImageKind(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
  });

  it('rejects non-images and oversized files', () => {
    expect(() => sanitizeImage(Buffer.from('GIF89a....'))).toThrow(
      ImageValidationError,
    );
    expect(() => sanitizeImage(Buffer.alloc(6 * 1024 * 1024, 0xff))).toThrow(
      '5 MB',
    );
  });

  it('strips PNG text/EXIF chunks and keeps the image', () => {
    const out = sanitizeImage(tinyPng());
    expect(out).toMatchObject({ kind: 'png', width: 1, height: 1 });
    expect(out.data.includes(Buffer.from('GPS'))).toBe(false);
    expect(out.data.includes(Buffer.from('eXIf'))).toBe(false);
    expect(out.data.includes(Buffer.from('IDAT'))).toBe(true);
  });

  it('strips JPEG EXIF (APP1) and comments but keeps JFIF and image data', () => {
    const out = sanitizeImage(tinyJpeg());
    expect(out).toMatchObject({ kind: 'jpeg', width: 32, height: 16 });
    expect(out.data.includes(Buffer.from('Exif'))).toBe(false);
    expect(out.data.includes(Buffer.from('Alice'))).toBe(false);
    expect(out.data.includes(Buffer.from('JFIF'))).toBe(true);
    expect(out.data.subarray(-2)).toEqual(Buffer.from([0xff, 0xd9]));
  });
});
