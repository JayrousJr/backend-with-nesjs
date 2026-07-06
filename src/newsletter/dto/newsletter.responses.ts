import { ObjectType } from '@nestjs/graphql';
import { MutationResponse, QueryListResponse } from '@common';
import { NewsletterSubscriberEntity } from '../entities/newsletter-subscriber.entity';

@ObjectType()
export class NewsletterMutationResponse extends MutationResponse(
  NewsletterSubscriberEntity,
) {}

@ObjectType()
export class NewsletterSubscriberListResponse extends QueryListResponse(
  NewsletterSubscriberEntity,
) {}
