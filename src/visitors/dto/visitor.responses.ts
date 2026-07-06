import { ObjectType } from '@nestjs/graphql';
import { QueryListResponse } from '@common';
import { PageViewEntity } from '../entities/page-view.entity';
import { VisitorStatEntity } from '../entities/visitor-stat.entity';

@ObjectType()
export class PageViewListResponse extends QueryListResponse(PageViewEntity) {}

@ObjectType()
export class VisitorStatListResponse extends QueryListResponse(
  VisitorStatEntity,
) {}
