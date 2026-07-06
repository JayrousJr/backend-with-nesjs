import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PERMISSIONS, RequirePermission } from '@permissions';
import { PaginationInput } from '@common';
import { NewsletterService } from './newsletter.service';
import { NewsletterSubscriberEntity } from './entities/newsletter-subscriber.entity';
import {
  NewsletterMutationResponse,
  NewsletterSubscriberListResponse,
} from './dto/newsletter.responses';
import { NewsletterSubscriberFilterInput } from './dto/newsletter-subscriber.filter';

@Resolver(() => NewsletterSubscriberEntity)
export class NewsletterResolver {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Query(() => NewsletterSubscriberEntity, {
    name: 'myNewsletterSubscription',
    nullable: true,
  })
  myNewsletterSubscription() {
    return this.newsletterService.getMySubscription();
  }

  @RequirePermission(PERMISSIONS.NEWSLETTER.READ)
  @Query(() => NewsletterSubscriberListResponse, {
    name: 'getNewsletterSubscribers',
  })
  getNewsletterSubscribers(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', {
      type: () => NewsletterSubscriberFilterInput,
      nullable: true,
    })
    filter?: NewsletterSubscriberFilterInput,
  ) {
    return this.newsletterService.getSubscribers(filter, pagination);
  }

  @Mutation(() => NewsletterMutationResponse)
  async subscribeToNewsletter(): Promise<NewsletterMutationResponse> {
    const data = await this.newsletterService.subscribe();
    return { data, message: 'success.NEWSLETTER.subscribe_message' };
  }

  @Mutation(() => NewsletterMutationResponse)
  async unsubscribeFromNewsletter(): Promise<NewsletterMutationResponse> {
    const data = await this.newsletterService.unsubscribe();
    return { data, message: 'success.NEWSLETTER.unsubscribe_message' };
  }
}
