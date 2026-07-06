import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { Type } from '@nestjs/common';
import type { PaginationMeta } from './pagination.input';

export interface IQueryResponse<T> {
  data: T;
}

export interface IQueryListResponse<T> extends PaginationMeta {
  data: T[];
}

export function QueryResponse<T>(DataType: Type<T>): Type<IQueryResponse<T>> {
  @ObjectType({ isAbstract: true })
  abstract class QueryResponseClass implements IQueryResponse<T> {
    @Field(() => DataType)
    data: T;
  }

  return QueryResponseClass as Type<IQueryResponse<T>>;
}

export function QueryListResponse<T>(
  DataType: Type<T>,
): Type<IQueryListResponse<T>> {
  @ObjectType({ isAbstract: true })
  abstract class QueryListResponseClass implements IQueryListResponse<T> {
    @Field(() => [DataType])
    data: T[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    totalPages: number;

    @Field(() => Boolean)
    hasNextPage: boolean;

    @Field(() => Boolean)
    hasPrevPage: boolean;
  }

  return QueryListResponseClass as Type<IQueryListResponse<T>>;
}
