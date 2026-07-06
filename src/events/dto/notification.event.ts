import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class NotificationEvent {
  @Field(() => String)
  type: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  body?: string | null;

  @Field(() => String, { nullable: true })
  resourceId?: string | null;
}
