import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { PERMISSIONS, RequirePermission } from '@permissions';
import { PaginationInput, Public } from '@common';
import { VisitorsService } from './visitors.service';
import { PageViewEntity } from './entities/page-view.entity';
import {
  PageViewListResponse,
  VisitorStatListResponse,
} from './dto/visitor.responses';
import { TrackPageViewInput } from './dto/track-page-view.input';
import {
  PageViewFilterInput,
  VisitorStatFilterInput,
} from './dto/visitor.filters';

@Resolver()
export class VisitorsResolver {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Public()
  @Mutation(() => PageViewEntity)
  trackPageView(
    @Args('input') input: TrackPageViewInput,
    @Context()
    ctx: {
      req: {
        ip?: string;
        headers: Record<string, string>;
        user?: { id: number };
      };
    },
  ) {
    return this.visitorsService.trackPageView(
      input,
      ctx.req.ip,
      ctx.req.headers['user-agent'],
      ctx.req.user?.id,
    );
  }

  @RequirePermission(PERMISSIONS.ANALYTICS.READ)
  @Query(() => PageViewListResponse, { name: 'getPageViews' })
  getPageViews(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', { type: () => PageViewFilterInput, nullable: true })
    filter?: PageViewFilterInput,
  ) {
    return this.visitorsService.getPageViews(filter, pagination);
  }

  @RequirePermission(PERMISSIONS.ANALYTICS.READ)
  @Query(() => VisitorStatListResponse, { name: 'getVisitorStats' })
  getVisitorStats(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', { type: () => VisitorStatFilterInput, nullable: true })
    filter?: VisitorStatFilterInput,
  ) {
    return this.visitorsService.getVisitorStats(filter, pagination);
  }
}
