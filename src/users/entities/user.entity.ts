import { BaseEntity } from '@common';
import { PermissionEntity, RoleEntity } from '@permissions';
import { ObjectType, Field } from '@nestjs/graphql';
import { FileEntity } from '../../storage/entities/file.entity';

@ObjectType()
export class UserEntity extends BaseEntity {
  @Field(() => String, { description: 'User Email' })
  email?: string;

  @Field(() => String, { description: 'First Name' })
  firstName?: string;

  @Field(() => String, { description: 'User Last Name' })
  lastName?: string;

  @Field(() => RoleEntity, { description: 'User Role' })
  role?: RoleEntity;

  @Field(() => String, {
    nullable: true,
    description: 'TenantId for SaaS Platforms',
  })
  tenantId?: string | null;

  @Field(() => [PermissionEntity], {
    nullable: true,
    description: 'Direct permissions granted to this user',
  })
  permissions?: PermissionEntity[];

  @Field(() => [PermissionEntity], {
    nullable: true,
    description:
      'All permissions: role permissions + direct user permissions (deduplicated)',
  })
  allPermissions?: PermissionEntity[];

  @Field(() => String, {
    description: 'Preferred display language (BCP 47 locale tag)',
  })
  preferredLocale?: string;

  @Field(() => Date, {
    nullable: true,
    description: 'When the user verified their email address',
  })
  emailVerifiedAt?: Date | null;

  @Field(() => FileEntity, { nullable: true })
  avatar?: FileEntity | null;
}
