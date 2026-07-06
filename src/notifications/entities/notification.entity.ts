import { BaseEntity } from '@common';
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { NotificationType } from '@db';

registerEnumType(NotificationType, { name: 'NotificationType' });

@ObjectType()
export class NotificationEntity extends BaseEntity {
  @Field(() => NotificationType)
  type: NotificationType;

  @Field(() => String, {
    description: 'Frontend i18n key for the notification title',
  })
  titleKey: string;

  @Field(() => String, {
    description: 'Frontend i18n key for the notification body',
  })
  messageKey: string;

  @Field(() => String, {
    nullable: true,
    description: 'JSON-encoded interpolation values for the i18n keys',
  })
  params?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'In-app route to navigate to when clicked',
  })
  link?: string | null;

  @Field(() => Date, { nullable: true })
  readAt?: Date | null;
}
