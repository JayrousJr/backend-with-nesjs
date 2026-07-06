import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '../permission.constants';

export const PERMISSION_KEY = 'permission';

export interface PermissionRequirement {
  permission: PermissionAction;
  roles?: string[];
}

/**
 * Gates a route/resolver behind the given permission, checked by
 * PermissionsGuard against the current user's effective permissions
 * (role permissions ∪ permissions granted directly to the user).
 *
 * If `roles` is provided, a user whose role is in that list passes
 * regardless of permission (e.g. RequirePermission(PERMISSIONS.USERS.READ, ['ADMIN'])
 * lets ADMIN through even without the users.read permission).
 */
export const RequirePermission = (
  permission?: PermissionAction,
  roles?: string[],
) => SetMetadata(PERMISSION_KEY, { permission, roles });
