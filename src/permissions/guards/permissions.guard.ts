import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUser, getRequest } from '@common';
import { PermissionsService } from '../permissions.service';
import {
  PERMISSION_KEY,
  PermissionRequirement,
} from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<
      PermissionRequirement | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requirement) {
      return true;
    }

    const user = getRequest(context).user as CurrentUser | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    if (requirement.roles?.includes(user.role)) {
      return true;
    }

    const allowed = await this.permissionsService.hasPermission(
      user.id,
      requirement.permission,
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
