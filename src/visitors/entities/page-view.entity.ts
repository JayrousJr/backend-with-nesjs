import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class PageViewEntity {
  @Field(() => Int)
  id?: number;

  @Field(() => String)
  path?: string;

  @Field(() => String, { nullable: true })
  referrer?: string | null;

  @Field(() => String, { nullable: true })
  userAgent?: string | null;

  @Field(() => String, { nullable: true })
  country?: string | null;

  @Field(() => String)
  sessionId?: string;

  @Field(() => Int, { nullable: true })
  userId?: number | null;

  @Field(() => Date)
  createdAt?: Date;
}
