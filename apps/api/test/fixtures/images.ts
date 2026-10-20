import { deflateSync } from 'zlib';

function crc32(buf: Buffer) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** 1×1 PNG, optionally carrying a GPS text chunk and an eXIf chunk. */
export function tinyPng(withMetadata = true) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    ...(withMetadata
      ? [
          chunk('tEXt', Buffer.from('GPS\x0041.3874,2.1686')),
          chunk('eXIf', Buffer.from('MM\x00*secret')),
        ]
      : []),
    chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** 32×16 JPEG skeleton with EXIF (APP1) and a comment segment. */
export function tinyJpeg() {
  const seg = (marker: number, body: Buffer) => {
    const len = Buffer.alloc(2);
    len.writeUInt16BE(body.length + 2);
    return Buffer.concat([Buffer.from([0xff, marker]), len, body]);
  };
  const sof = Buffer.from([8, 0, 16, 0, 32, 1, 1, 0x11, 0]);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    seg(
      0xe0,
      Buffer.from('JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00', 'binary'),
    ),
    seg(0xe1, Buffer.from('Exif\x00\x00GPSLatitude=41.38', 'binary')),
    seg(0xfe, Buffer.from('taken by Alice')),
    seg(0xc0, sof),
    seg(0xda, Buffer.from([1, 1, 0, 0, 63, 0])),
    Buffer.from([0x12, 0x34, 0xff, 0xd9]),
  ]);
}
