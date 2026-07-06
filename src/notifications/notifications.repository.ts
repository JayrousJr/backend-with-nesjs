import { BaseRepository } from '@common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { Prisma } from '@db';

@Injectable()
export class NotificationsRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.notification;
  }

  async create(data: Prisma.NotificationCreateInput) {
    return this.execute(this.delegate.create({ data }));
  }

  async findMany(args: {
    where?: Prisma.NotificationWhereInput;
    skip?: number;
    take?: number;
  }) {
    return this.execute(
      this.delegate.findMany({ ...args, orderBy: { createdAt: 'desc' } }),
    );
  }

  async count(where?: Prisma.NotificationWhereInput) {
    return this.execute(this.delegate.count({ where }));
  }

  async countUnread(userId: number) {
    return this.execute(
      this.delegate.count({ where: { userId, readAt: null } }),
    );
  }

  async findByUniqueId(uniqueId: string) {
    return this.execute(this.delegate.findFirst({ where: { uniqueId } }));
  }

  async markRead(id: number) {
    return this.execute(
      this.delegate.update({ where: { id }, data: { readAt: new Date() } }),
    );
  }

  async markAllRead(userId: number) {
    return this.execute(
      this.delegate.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      }),
    );
  }
}
