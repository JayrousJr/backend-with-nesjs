import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PaginationInput, offsetPaginate } from '@common';
import { VisitorsRepository } from './visitors.repository';
import { TrackPageViewInput } from './dto/track-page-view.input';
import {
  PageViewFilterInput,
  VisitorStatFilterInput,
  buildPageViewWhere,
  buildVisitorStatWhere,
} from './dto/visitor.filters';

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(private readonly visitors: VisitorsRepository) {}

  async trackPageView(
    input: TrackPageViewInput,
    ip?: string,
    userAgent?: string,
    userId?: number,
  ) {
    const ipHash = ip
      ? createHash('sha256').update(ip).digest('hex').slice(0, 16)
      : null;

    return this.visitors.createPageView({
      path: input.path,
      sessionId: input.sessionId,
      referrer: input.referrer,
      userAgent: userAgent ?? null,
      ipHash,
      ...(userId && { user: { connect: { id: userId } } }),
    });
  }

  getPageViews(filter?: PageViewFilterInput, pagination?: PaginationInput) {
    const where = buildPageViewWhere(filter);
    return offsetPaginate(
      (args) => this.visitors.findPageViews({ ...args, where }),
      () => this.visitors.countPageViews(where),
      pagination,
    );
  }

  getVisitorStats(
    filter?: VisitorStatFilterInput,
    pagination?: PaginationInput,
  ) {
    const where = buildVisitorStatWhere(filter);
    return offsetPaginate(
      (args) => this.visitors.findVisitorStats({ ...args, where }),
      () => this.visitors.countVisitorStats(where),
      pagination,
    );
  }

  async aggregateDaily(date: Date): Promise<number> {
    return this.visitors.aggregateDaily(date);
  }

  async aggregateYesterday(): Promise<void> {
    // UTC, not local time — the DB connection is pinned to UTC (see
    // PrismaService) and aggregateDaily() buckets days in UTC, so "yesterday"
    // must be computed the same way or a non-UTC server timezone shifts every
    // aggregated row onto the wrong date.
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const count = await this.visitors.aggregateDaily(yesterday);
    if (count > 0) {
      this.logger.log(`Aggregated ${count} visitor stat(s) for yesterday`);
    }
  }
}
