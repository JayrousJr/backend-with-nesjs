import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PaginationInput } from '@common';
import { IMessageMutationResponse } from '@common/dto/mutation-response.type';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from './entities/notification.entity';
import {
  MarkAllNotificationsReadResponse,
  NotificationListResponse,
  NotificationMutationResponse,
} from './dto/notification.responses';
import { NotificationFilterInput } from './dto/notification.filter';

/**
 * All operations are scoped to the current user — there is no admin
 * cross-user notification access, so no @RequirePermission gates here.
 */
@Resolver(() => NotificationEntity)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationListResponse, { name: 'getMyNotifications' })
  getMyNotifications(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', { type: () => NotificationFilterInput, nullable: true })
    filter?: NotificationFilterInput,
  ) {
    return this.notificationsService.getMyNotifications(filter, pagination);
  }

  @Mutation(() => NotificationMutationResponse)
  async markNotificationRead(
    @Args('uniqueId') uniqueId: string,
  ): Promise<NotificationMutationResponse> {
    const data = await this.notificationsService.markRead(uniqueId);
    return { data, message: 'success.NOTIFICATION_READ' };
  }

  @Mutation(() => MarkAllNotificationsReadResponse)
  async markAllNotificationsRead(): Promise<IMessageMutationResponse> {
    await this.notificationsService.markAllRead();
    return { message: 'success.NOTIFICATION_READ_ALL' };
  }
}
