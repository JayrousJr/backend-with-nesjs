import { Injectable } from '@nestjs/common';
import { Prisma } from '@db';
import { PrismaService } from '@prisma';

@Injectable()
export class VisitorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPageView(data: Prisma.PageViewCreateInput) {
    return this.prisma.db.pageView.create({ data });
  }

  async findPageViews(args: {
    where?: Prisma.PageViewWhereInput;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.db.pageView.findMany({
      ...args,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countPageViews(where?: Prisma.PageViewWhereInput) {
    return this.prisma.db.pageView.count({ where });
  }

  async findVisitorStats(args: {
    where?: Prisma.VisitorStatWhereInput;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.db.visitorStat.findMany({
      ...args,
      orderBy: { date: 'desc' },
    });
  }

  async countVisitorStats(where?: Prisma.VisitorStatWhereInput) {
    return this.prisma.db.visitorStat.count({ where });
  }

  async aggregateDaily(date: Date): Promise<number> {
    // UTC day boundaries, not local time: setHours()/local Date math would
    // shift the bucket onto the wrong calendar day on any server whose OS
    // timezone isn't UTC (this connection is pinned to UTC — see
    // PrismaService — so the stored `date` must be computed the same way).
    const startOfDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const endOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const stats = await this.prisma.db.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      _count: { id: true },
    });

    const uniqueCounts = await Promise.all(
      stats.map(async (s) => {
        const unique = await this.prisma.db.pageView.groupBy({
          by: ['sessionId'],
          where: {
            path: s.path,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        });
        return { path: s.path, views: s._count.id, unique: unique.length };
      }),
    );

    let upserted = 0;
    for (const entry of uniqueCounts) {
      await this.prisma.db.visitorStat.upsert({
        where: { date_path: { date: startOfDay, path: entry.path } },
        update: {
          viewCount: entry.views,
          uniqueVisitorCount: entry.unique,
        },
        create: {
          date: startOfDay,
          path: entry.path,
          viewCount: entry.views,
          uniqueVisitorCount: entry.unique,
        },
      });
      upserted++;
    }

    return upserted;
  }
}
