import { dirname, join } from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { StorageDriver } from './storage-driver.interface';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export class LocalStorageDriver implements StorageDriver {
  async put(buffer: Buffer, key: string): Promise<string> {
    const filePath = join(UPLOAD_DIR, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return key;
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(UPLOAD_DIR, key));
    } catch {
      // File already removed from disk — no-op.
    }
  }

  getUrl(key: string): string {
    return `/api/files/download/${key}`;
  }
}
