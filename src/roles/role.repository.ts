import { BaseRepository } from '@common';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@db';
import { PrismaService } from '@prisma';

interface RoleWriteData {
  name?: string;
  description?: string | null;
  permissionNames?: string[];
}

@Injectable()
export class RolesRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.role;
  }

  findAll() {
    return this.execute(
      this.delegate.findMany({ include: { permissions: true } }),
    );
  }

  findMany(args: {
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return this.execute(
      this.delegate.findMany({
        ...args,
        include: { permissions: true },
      }),
    );
  }

  count(where?: Prisma.RoleWhereInput) {
    return this.execute(this.delegate.count({ where }));
  }

  findByUniqueId(uniqueId: string) {
    return this.execute(
      this.delegate.findFirst({
        where: { uniqueId },
        include: { permissions: true },
      }),
    );
  }

  create(data: RoleWriteData & { name: string }) {
    return this.execute(
      this.delegate.create({
        data: {
          name: data.name,
          description: data.description,
          ...(data.permissionNames
            ? {
                permissions: {
                  connect: data.permissionNames.map((name) => ({ name })),
                },
              }
            : {}),
        },
        include: { permissions: true },
      }),
    );
  }

  updateByUniqueId(uniqueId: string, data: RoleWriteData) {
    return this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.permissionNames
            ? {
                permissions: {
                  set: data.permissionNames.map((name) => ({ name })),
                },
              }
            : {}),
        },
        include: { permissions: true },
      }),
    );
  }
}
