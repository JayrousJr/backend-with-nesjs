import { BaseRepository } from '@common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { Prisma } from '@db';

@Injectable()
export class NewsletterRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.newsletterSubscriber;
  }

  async findByUserId(userId: number) {
    return this.execute(this.delegate.findFirst({ where: { userId } }));
  }

  async upsertByUserId(
    userId: number,
    data: Prisma.NewsletterSubscriberUpdateInput,
  ) {
    return this.execute(
      this.prisma.db.newsletterSubscriber.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data } as Prisma.NewsletterSubscriberCreateInput,
      }),
    );
  }

  async updateByUserId(
    userId: number,
    data: Prisma.NewsletterSubscriberUpdateInput,
  ) {
    return this.execute(this.delegate.update({ where: { userId }, data }));
  }

  async findMany(args: {
    where?: Prisma.NewsletterSubscriberWhereInput;
    skip?: number;
    take?: number;
  }) {
    return this.execute(
      this.delegate.findMany({
        ...args,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
    );
  }

  async count(where?: Prisma.NewsletterSubscriberWhereInput) {
    return this.execute(this.delegate.count({ where }));
  }

  async checkActiveSubscribedUser(userId: number) {
    const userSub = this.prisma.db.newsletterSubscriber.findFirst({
      where: { userId: userId, isActive: true },
    });
    return userSub;
  }

  async checkInActiveSubscribedUser(userId: number) {
    const userSub = this.prisma.db.newsletterSubscriber.findFirst({
      where: { userId: userId, isActive: false },
    });
    return userSub;
  }
}
