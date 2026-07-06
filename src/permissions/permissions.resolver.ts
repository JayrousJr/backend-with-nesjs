import { Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '@prisma';
import { PermissionEntity } from './entities/permission.entity';
import { PERMISSIONS } from './permission.constants';
import { RequirePermission } from './decorators/require-permission.decorator';

@Resolver(() => PermissionEntity)
export class PermissionsResolver {
  constructor(private readonly prisma: PrismaService) {}

  @RequirePermission(PERMISSIONS.PERMISSIONS.READ)
  @Query(() => [PermissionEntity], { name: 'getAllPermissions' })
  getAllPermissions() {
    return this.prisma.db.permission.findMany();
  }
}
