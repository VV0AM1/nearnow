import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { memoryStorage } from 'multer';
import {
  ImageValidationError,
  MAX_IMAGE_BYTES,
  sanitizeImage,
  type SanitizedImage,
} from './image-sanitizer';
import { STORAGE_ADAPTER, type StorageAdapter } from './storage';

const EXT = { jpeg: 'jpg', png: 'png', webp: 'webp' } as const;

/** Multer options for single-image endpoints: in-memory, size- and count-limited. */
export const imageUploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
    fields: 20,
    fieldSize: 16 * 1024,
  },
};

@Injectable()
export class UploadsService {
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  /** Validates, strips metadata and stores an uploaded image. Returns its public path. */
  async storeImage(file: Express.Multer.File): Promise<string> {
    let image: SanitizedImage;
    try {
      image = sanitizeImage(file.buffer);
    } catch (e) {
      if (e instanceof ImageValidationError)
        throw new BadRequestException(e.message);
      throw e;
    }
    const key = `${randomUUID()}.${EXT[image.kind]}`;
    return this.storage.save(key, image.data, image.mime);
  }

  remove(publicPath: string | null | undefined) {
    if (!publicPath) return Promise.resolve();
    return this.storage.remove(publicPath);
  }
}
