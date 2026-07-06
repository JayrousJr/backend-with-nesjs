import { BaseEntity } from '@common';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PermissionEntity extends BaseEntity {
  @Field(() => String, { description: 'Permission key, e.g. users.delete' })
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Permission description',
  })
  description?: string | null;
}
