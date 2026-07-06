import { ObjectType, Field, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common';

@ObjectType()
export class FileEntity extends BaseEntity {
  @Field(() => String)
  filename?: string;

  @Field(() => String)
  mimeType?: string;

  @Field(() => Int)
  size?: number;

  @Field(() => String)
  uri?: string;
}
