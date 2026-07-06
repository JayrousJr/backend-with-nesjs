import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsRepository } from './notifications.repository';

// EventsModule is @Global, so EventsGateway is injectable without importing it.
@Module({
  providers: [
    NotificationsResolver,
    NotificationsService,
    NotificationsRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
