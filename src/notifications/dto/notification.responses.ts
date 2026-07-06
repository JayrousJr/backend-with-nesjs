import { ObjectType, Field, Int } from '@nestjs/graphql';
import { MutationResponse, QueryListResponse } from '@common';
import { createMessageResponse } from '@common/dto/mutation-response.type';
import { NotificationEntity } from '../entities/notification.entity';

@ObjectType()
export class NotificationMutationResponse extends MutationResponse(
  NotificationEntity,
) {}

@ObjectType()
export class NotificationListResponse extends QueryListResponse(
  NotificationEntity,
) {
  @Field(() => Int, {
    description: 'Total unread notifications for the current user',
  })
  unreadCount: number;
}

export const MarkAllNotificationsReadResponse = createMessageResponse(
  'MarkAllNotificationsReadResponse',
);
