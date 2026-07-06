import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorsResolver } from './visitors.resolver';
import { VisitorsRepository } from './visitors.repository';
import { VisitorStatsCron } from './visitor-stats.cron';

@Module({
  providers: [
    VisitorsResolver,
    VisitorsService,
    VisitorsRepository,
    VisitorStatsCron,
  ],
  exports: [VisitorsService],
})
export class VisitorsModule {}
