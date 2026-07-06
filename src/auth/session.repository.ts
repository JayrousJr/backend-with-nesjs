import { BaseRepository } from '@common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { Session } from '@db';

@Injectable()
export class SessionsRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.session;
  }

  async create(data: {
    userId: number;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<Session> {
    return this.execute(this.delegate.create({ data }));
  }

  async findActiveByUniqueId(uniqueId: string): Promise<Session | null> {
    return this.execute(
      this.delegate.findFirst({
        where: { uniqueId, isActive: true, expiresAt: { gt: new Date() } },
      }),
    );
  }

  async revoke(uniqueId: string): Promise<void> {
    return this.softDelete(uniqueId);
  }

  async findAllActiveForUser(userId: number): Promise<
    {
      uniqueId: string;
      userAgent: string | null;
      ipAddress: string | null;
      createdAt: Date;
      expiresAt: Date;
    }[]
  > {
    return this.execute(
      this.delegate.findMany({
        where: { userId, isDeleted: false, expiresAt: { gt: new Date() } },
        select: {
          uniqueId: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findActiveByUniqueIdAndUser(
    uniqueId: string,
    userId: number,
  ): Promise<Session | null> {
    return this.execute(
      this.delegate.findFirst({
        where: {
          uniqueId,
          userId,
          isDeleted: false,
          expiresAt: { gt: new Date() },
        },
      }),
    );
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.execute(
      this.delegate.updateMany({
        where: { userId, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
    );
  }
}
