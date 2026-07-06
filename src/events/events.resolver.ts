import { Resolver, Subscription } from '@nestjs/graphql';
import { Public } from '@common';
import { PubSubService } from './pubsub.service';
import { NotificationEvent } from './dto/notification.event';

export const EVENTS = {
  NOTIFICATION: 'notification',
} as const;

@Resolver()
export class EventsResolver {
  constructor(private readonly pubsub: PubSubService) {}

  @Public()
  @Subscription(() => NotificationEvent, {
    description: 'Receive real-time notifications',
  })
  onNotification() {
    return this.pubsub.asyncIterator<NotificationEvent>(EVENTS.NOTIFICATION);
  }
}
