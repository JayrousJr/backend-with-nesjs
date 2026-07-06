import { Field, InputType, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class PaginationInput {
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number = 1;

  @Min(1, { message: i18nValidationMessage('validation.min') })
  @Max(100, { message: i18nValidationMessage('validation.max') })
  @Field(() => Int, { nullable: true, defaultValue: 10 })
  limit?: number = 10;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function offsetPaginate<T>(
  findMany: (args: { skip: number; take: number }) => Promise<T[]>,
  count: () => Promise<number>,
  pagination?: PaginationInput,
): Promise<PaginationMeta & { data: T[] }> {
  const page = Math.max(1, pagination?.page ?? 1);
  const limit = Math.min(100, pagination?.limit ?? 10);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    findMany({ skip, take: limit }),
    count(),
  ]);

  return { data, ...buildPaginationMeta(total, page, limit) };
}
