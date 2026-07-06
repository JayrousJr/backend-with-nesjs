import { BaseRepository } from '@common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { Prisma } from '@db';

@Injectable()
export class CampaignRecipientRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.campaignRecipient;
  }

  async createMany(data: Prisma.CampaignRecipientCreateManyInput[]) {
    return this.execute(
      this.prisma.db.campaignRecipient.createMany({
        data,
        skipDuplicates: true,
      }),
    );
  }

  async findByCampaignId(campaignId: number) {
    return this.execute(
      this.delegate.findMany({
        where: { campaignId },
        include: {
          subscriber: {
            include: { user: { select: { email: true } } },
          },
        },
      }),
    );
  }

  async findMany(args: {
    where?: Prisma.CampaignRecipientWhereInput;
    skip?: number;
    take?: number;
  }) {
    return this.execute(
      this.delegate.findMany({
        ...args,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriber: {
            include: {
              user: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
          },
        },
      }),
    );
  }

  async count(where?: Prisma.CampaignRecipientWhereInput) {
    return this.execute(this.delegate.count({ where }));
  }

  async updateStatus(id: number, status: string) {
    return this.execute(
      this.delegate.update({
        where: { id },
        data: { status: status as any },
      }),
    );
  }
}
