import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { Prisma } from '@db';

@InputType()
export class PageViewFilterInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  path?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sessionId?: string;

  @IsOptional()
  @Field(() => Date, { nullable: true })
  from?: Date;

  @IsOptional()
  @Field(() => Date, { nullable: true })
  to?: Date;
}

@InputType()
export class VisitorStatFilterInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  path?: string;

  @IsOptional()
  @Field(() => Date, { nullable: true })
  from?: Date;

  @IsOptional()
  @Field(() => Date, { nullable: true })
  to?: Date;
}

export function buildPageViewWhere(
  filter?: PageViewFilterInput,
): Prisma.PageViewWhereInput {
  return {
    ...(filter?.path && {
      path: { contains: filter.path, mode: 'insensitive' },
    }),
    ...(filter?.sessionId && { sessionId: filter.sessionId }),
    ...((filter?.from || filter?.to) && {
      createdAt: {
        ...(filter?.from && { gte: filter.from }),
        ...(filter?.to && { lte: filter.to }),
      },
    }),
  };
}

export function buildVisitorStatWhere(
  filter?: VisitorStatFilterInput,
): Prisma.VisitorStatWhereInput {
  return {
    ...(filter?.path && {
      path: { contains: filter.path, mode: 'insensitive' },
    }),
    ...((filter?.from || filter?.to) && {
      date: {
        ...(filter?.from && { gte: filter.from }),
        ...(filter?.to && { lte: filter.to }),
      },
    }),
  };
}
