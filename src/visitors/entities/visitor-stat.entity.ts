import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class VisitorStatEntity {
  @Field(() => Date)
  date?: Date;

  @Field(() => String)
  path?: string;

  @Field(() => Int)
  viewCount?: number;

  @Field(() => Int)
  uniqueVisitorCount?: number;
}
