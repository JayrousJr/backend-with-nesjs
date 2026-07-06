import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';
import { Prisma } from '@db';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class NotificationFilterInput {
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @Field(() => Boolean, { nullable: true })
  unreadOnly?: boolean;
}

export function buildNotificationWhere(
  userId: number,
  filter?: NotificationFilterInput,
): Prisma.NotificationWhereInput {
  return {
    userId,
    ...(filter?.unreadOnly && { readAt: null }),
  };
}
