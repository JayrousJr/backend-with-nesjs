import { BaseEntity } from '@common';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class NewsletterSubscriberEntity extends BaseEntity {
  @Field(() => String, { description: 'Subscriber user ID' })
  userId?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Subscriber email (via user), populated on admin listings',
  })
  email?: string;

  @Field(() => String, { nullable: true })
  firstName?: string;

  @Field(() => String, { nullable: true })
  lastName?: string;
}
