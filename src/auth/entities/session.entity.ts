import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SessionEntity {
  @Field(() => String)
  uniqueId: string;

  @Field(() => String, { nullable: true })
  userAgent?: string | null;

  @Field(() => String, { nullable: true })
  ipAddress?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  expiresAt: Date;
}
