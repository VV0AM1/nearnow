import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

/**
 * Where uploaded files live. The local-disk adapter is suitable for development
 * and for hosts with a persistent volume (docker-compose.prod.yml mounts one).
 * Hosts with ephemeral disks (e.g. Render's free plan) lose files on redeploy:
 * add an object-storage adapter implementing this interface before relying on them.
 */
export interface StorageAdapter {
  /** Stores the bytes under a server-generated key; returns the public path. */
  save(key: string, data: Buffer, contentType: string): Promise<string>;
  remove(publicPath: string): Promise<void>;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

export class LocalDiskStorage implements StorageAdapter {
  private readonly root: string;

  constructor(dir: string) {
    this.root = resolve(dir);
  }

  async save(key: string, data: Buffer): Promise<string> {
    if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(key))
      throw new Error('Invalid storage key');
    await mkdir(this.root, { recursive: true });
    await writeFile(join(this.root, key), data, { flag: 'wx' });
    return `/uploads/${key}`;
  }

  async remove(publicPath: string): Promise<void> {
    const key = publicPath.replace(/^\/uploads\//, '');
    if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(key)) return;
    await unlink(join(this.root, key)).catch(() => undefined);
  }
}
