import type { BaseFilterInput } from './base-filter.input';

export interface BaseWhereClause {
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: { gte?: Date; lte?: Date };
  updatedAt?: { gte?: Date; lte?: Date };
}

export function buildBaseWhere(filter?: BaseFilterInput): BaseWhereClause {
  if (!filter) return {};
  return {
    ...(filter.isActive !== undefined && { isActive: filter.isActive }),
    ...(filter.isDeleted !== undefined && { isDeleted: filter.isDeleted }),
    ...(filter.createdAt && {
      createdAt: {
        ...(filter.createdAt.from && { gte: filter.createdAt.from }),
        ...(filter.createdAt.to && { lte: filter.createdAt.to }),
      },
    }),
    ...(filter.updatedAt && {
      updatedAt: {
        ...(filter.updatedAt.from && { gte: filter.updatedAt.from }),
        ...(filter.updatedAt.to && { lte: filter.updatedAt.to }),
      },
    }),
  };
}
