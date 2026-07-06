import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class PubSubService {
  private readonly pubsub = new PubSub();

  publish(event: string, payload: Record<string, unknown>): Promise<void> {
    return this.pubsub.publish(event, payload);
  }

  asyncIterator<T>(events: string | string[]) {
    return this.pubsub.asyncIterableIterator<T>(events);
  }
}
