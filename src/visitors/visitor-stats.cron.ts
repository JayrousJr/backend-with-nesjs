import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VisitorsService } from './visitors.service';

@Injectable()
export class VisitorStatsCron {
  constructor(private readonly visitors: VisitorsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregate() {
    await this.visitors.aggregateYesterday();
  }
}
