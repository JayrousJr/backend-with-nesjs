import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '@prisma';
import { PermissionAction } from './permission.constants';

const CACHE_TTL_MS = 60_000;

function cacheKey(userId: number): string {
  return `permissions:user:${userId}`;
}

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * A user's effective permissions are the union of their role's permissions
   * and any permissions granted directly to them.
   */

  async getEffectivePermissions(userId: number): Promise<Set<string>> {
    const cached = await this.cache.get<string[]>(cacheKey(userId));
    if (cached) {
      return new Set(cached);
    }

    const user = await this.prisma.db.user.findFirst({
      where: { id: userId },
      include: {
        role: { include: { permissions: true } },
        permissions: true,
      },
    });

    const permissions = new Set<string>();
    if (user) {
      for (const permission of user.role.permissions) {
        permissions.add(permission.name);
      }
      for (const permission of user.permissions) {
        permissions.add(permission.name);
      }
    }

    await this.cache.set(cacheKey(userId), [...permissions], CACHE_TTL_MS);
    return permissions;
  }

  async hasPermission(
    userId: number,
    permission: PermissionAction,
  ): Promise<boolean> {
    const permissions = await this.getEffectivePermissions(userId);
    return permissions.has(permission);
  }

  async invalidate(userId: number): Promise<void> {
    await this.cache.del(cacheKey(userId));
  }
}
