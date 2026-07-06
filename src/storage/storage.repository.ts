import { Injectable } from '@nestjs/common';
import { Prisma } from '@db';
import { BaseRepository } from '@common';
import { PrismaService } from '@prisma';

@Injectable()
export class StorageRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.file;
  }

  async create(data: Prisma.FileCreateInput) {
    return this.execute(this.delegate.create({ data }));
  }

  async findByUniqueId(uniqueId: string) {
    return this.execute(this.delegate.findUnique({ where: { uniqueId } }));
  }

  async findMany(args: {
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.FileOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return this.execute(this.delegate.findMany(args));
  }

  async count(where?: Prisma.FileWhereInput) {
    return this.execute(this.delegate.count({ where }));
  }

  /** Raw client: the default `db` client hides isDeleted rows from find/count. */
  async findSoftDeletedBefore(cutoff: Date) {
    return this.execute(
      this.prisma.dbRaw.file.findMany({
        where: { isDeleted: true, deletedAt: { lt: cutoff } },
      }),
    );
  }

  async hardDeleteById(id: number) {
    return this.execute(this.prisma.dbRaw.file.delete({ where: { id } }));
  }
}
