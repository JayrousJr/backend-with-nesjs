import { BaseRepository } from '@common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { Prisma } from '@db';

@Injectable()
export class CampaignRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.campaign;
  }

  async create(data: Prisma.CampaignCreateInput) {
    return this.execute(this.delegate.create({ data }));
  }

  async findByUniqueId(uniqueId: string) {
    return this.execute(this.delegate.findFirst({ where: { uniqueId } }));
  }

  async findMany(args: {
    where?: Prisma.CampaignWhereInput;
    orderBy?: Prisma.CampaignOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return this.execute(this.delegate.findMany(args));
  }

  async count(where?: Prisma.CampaignWhereInput) {
    return this.execute(this.delegate.count({ where }));
  }

  async updateByUniqueId(uniqueId: string, data: Prisma.CampaignUpdateInput) {
    return this.execute(this.delegate.update({ where: { uniqueId }, data }));
  }
}
