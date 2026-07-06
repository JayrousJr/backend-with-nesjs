import { BaseEntity } from '@common';
import { ObjectType, Field } from '@nestjs/graphql';
import { PermissionEntity } from './permission.entity';

@ObjectType()
export class RoleEntity extends BaseEntity {
  @Field(() => String, { description: 'Role name, e.g. ADMIN' })
  name?: string;

  @Field(() => String, { nullable: true, description: 'Role description' })
  description?: string | null;

  @Field(() => [PermissionEntity], { nullable: true })
  permissions?: PermissionEntity[];
}
