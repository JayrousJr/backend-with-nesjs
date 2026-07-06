/// <reference types="multer" />
import {
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { PaginationInput, offsetPaginate } from '@common';
import { StorageRepository } from './storage.repository';
import type { StorageDriver } from './drivers/storage-driver.interface';
import { STORAGE_DRIVER } from './storage.constants';
import {
  FileFilterInput,
  FileOrderInput,
  buildFileWhere,
  buildFileOrderBy,
} from './dto/file-filter';

@Injectable()
export class StorageService {
  constructor(
    private readonly files: StorageRepository,
    @Inject(STORAGE_DRIVER) private readonly driver: StorageDriver,
  ) {}

  async upload(file: Express.Multer.File, folder: string, uploaderId?: number) {
    const ext = extname(file.originalname);
    const key = `${folder}/${randomUUID()}${ext}`;
    const uri = await this.driver.put(file.buffer, key, file.mimetype);

    return this.files.create({
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uri,
      createdById: uploaderId,
    });
  }

  async uploadMany(
    fileList: Express.Multer.File[],
    folder: string,
    uploaderId?: number,
  ) {
    return Promise.all(fileList.map((f) => this.upload(f, folder, uploaderId)));
  }

  async getFile(uniqueId: string) {
    const file = await this.files.findByUniqueId(uniqueId);
    if (!file) throw new NotFoundException('errors.record_not_found');
    return file;
  }

  getFiles(
    filter?: FileFilterInput,
    orderBy?: FileOrderInput,
    pagination?: PaginationInput,
  ) {
    const where = buildFileWhere(filter);
    const order = buildFileOrderBy(orderBy);

    return offsetPaginate(
      (args) => this.files.findMany({ ...args, where, orderBy: order }),
      () => this.files.count(where),
      pagination,
    );
  }

  async deleteFile(uniqueId: string) {
    const file = await this.getFile(uniqueId);
    await this.driver.delete(file.uri);
    await this.files.softDelete(uniqueId);
  }

  /**
   * Hard-purge soft-deleted file rows past the retention cutoff. Files can't
   * be purged with a bulk SQL delete like other models: each row's blob must
   * be removed through the storage driver, and one failing row (e.g. a stale
   * FK reference) shouldn't abort the rest of the batch.
   */
  async purgeSoftDeletedBefore(cutoff: Date): Promise<number> {
    const files = await this.files.findSoftDeletedBefore(cutoff);
    let purged = 0;
    for (const file of files) {
      try {
        // Best-effort: deleteFile() already removed the blob at soft-delete
        // time, and both drivers tolerate deleting a missing object.
        await this.driver.delete(file.uri);
        await this.files.hardDeleteById(file.id);
        purged++;
      } catch {
        // Leave the row for the next run rather than failing the whole purge.
      }
    }
    return purged;
  }

  getFileStream(uri: string): StreamableFile {
    const filePath = join(process.cwd(), 'uploads', uri);
    const stream = createReadStream(filePath);
    return new StreamableFile(stream);
  }
}
