import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { Prisma, CampaignStatus } from '@db';
import { BaseFilterInput, OrderDirection, buildBaseWhere } from '@common';
import { i18nValidationMessage } from 'nestjs-i18n';

export enum CampaignOrderField {
  SUBJECT = 'subject',
  STATUS = 'status',
  SCHEDULED_AT = 'scheduledAt',
  CREATED_AT = 'createdAt',
}

registerEnumType(CampaignOrderField, { name: 'CampaignOrderField' });

@InputType()
export class CampaignFilterInput extends BaseFilterInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  subject?: string;

  @IsOptional()
  @Field(() => CampaignStatus, { nullable: true })
  status?: CampaignStatus;
}

@InputType()
export class CampaignOrderInput {
  @IsEnum(CampaignOrderField, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @Field(() => CampaignOrderField, {
    defaultValue: CampaignOrderField.CREATED_AT,
  })
  field: CampaignOrderField = CampaignOrderField.CREATED_AT;

  @IsEnum(OrderDirection, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @Field(() => OrderDirection, { defaultValue: OrderDirection.DESC })
  direction: OrderDirection = OrderDirection.DESC;
}

export function buildCampaignWhere(
  filter?: CampaignFilterInput,
): Prisma.CampaignWhereInput {
  return {
    ...buildBaseWhere(filter),
    ...(filter?.subject && {
      subject: { contains: filter.subject, mode: 'insensitive' as const },
    }),
    ...(filter?.status && { status: filter.status }),
  };
}

export function buildCampaignOrderBy(
  orderBy?: CampaignOrderInput,
): Prisma.CampaignOrderByWithRelationInput {
  if (!orderBy) return { createdAt: 'desc' };
  const direction = orderBy.direction === OrderDirection.ASC ? 'asc' : 'desc';
  return {
    [orderBy.field]: direction,
  };
}
