import { BaseFilterInput, buildBaseWhere, OrderDirection } from '@common';
import { Prisma } from '@db';
import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export enum RoleOrderField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

registerEnumType(RoleOrderField, { name: 'RoleOrderField' });

@InputType()
export class RoleFilterInput extends BaseFilterInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  name!: string;
}

@InputType()
export class RoleOrderInput {
  @IsEnum(RoleOrderField, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @Field(() => RoleOrderField, { defaultValue: RoleOrderField.CREATED_AT })
  field: RoleOrderField = RoleOrderField.CREATED_AT;

  @IsEnum(OrderDirection, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @Field(() => OrderDirection, { defaultValue: OrderDirection.DESC })
  direction: OrderDirection = OrderDirection.DESC;
}

export function buildRoleWhere(
  filter?: RoleFilterInput,
): Prisma.RoleWhereInput {
  return {
    ...buildBaseWhere(filter),
    ...(filter?.name && {
      name: { contains: filter.name, mode: 'insensitive' },
    }),
    ...(filter?.uniqueId && {
      uniqueId: { contains: filter.uniqueId, mode: 'insensitive' },
    }),
  };
}

export function buildRoleOrderby(
  orderBy?: RoleOrderInput,
): Prisma.RoleOrderByWithRelationInput {
  if (!orderBy) return { createdAt: 'desc' };
  const direction = orderBy.direction === OrderDirection.ASC ? 'asc' : 'desc';
  return { [orderBy.field]: direction } as Prisma.RoleOrderByWithRelationInput;
}
