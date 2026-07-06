import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { Prisma } from '@db';
import { BaseFilterInput, OrderDirection, buildBaseWhere } from '@common';
import { i18nValidationMessage } from 'nestjs-i18n';

export enum UserOrderField {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
}

registerEnumType(UserOrderField, { name: 'UserOrderField' });

@InputType()
export class UserFilterInput extends BaseFilterInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  email?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  firstName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  lastName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  role?: string;
}

@InputType()
export class UserOrderInput {
  @IsEnum(UserOrderField, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @Field(() => UserOrderField, { defaultValue: UserOrderField.CREATED_AT })
  field: UserOrderField = UserOrderField.CREATED_AT;

  @IsEnum(OrderDirection, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @Field(() => OrderDirection, { defaultValue: OrderDirection.DESC })
  direction: OrderDirection = OrderDirection.DESC;
}

export function buildUserWhere(
  filter?: UserFilterInput,
): Prisma.UserWhereInput {
  return {
    ...buildBaseWhere(filter),
    ...(filter?.email && {
      email: { contains: filter.email, mode: 'insensitive' },
    }),
    ...(filter?.firstName && {
      firstName: { contains: filter.firstName, mode: 'insensitive' },
    }),
    ...(filter?.lastName && {
      lastName: { contains: filter.lastName, mode: 'insensitive' },
    }),
    ...(filter?.uniqueId && {
      uniqueId: { contains: filter.uniqueId, mode: 'insensitive' },
    }),
    ...(filter?.role && { role: { name: filter.role } }),
  };
}

export function buildUserOrderBy(
  orderBy?: UserOrderInput,
): Prisma.UserOrderByWithRelationInput {
  if (!orderBy) return { createdAt: 'desc' };
  const direction = orderBy.direction === OrderDirection.ASC ? 'asc' : 'desc';
  return { [orderBy.field]: direction } as Prisma.UserOrderByWithRelationInput;
}
