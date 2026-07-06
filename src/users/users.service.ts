import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaginationInput, RequestContext, offsetPaginate } from '@common';
import {
  UserFilterInput,
  UserOrderInput,
  buildUserWhere,
  buildUserOrderBy,
} from './dto/user-filter';
import { PrismaService } from '@prisma';
import { DEFAULT_ROLE_NAME, PermissionsService } from '@permissions';
import { StorageService } from '../storage/storage.service';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './user.repository';
import { CreateUserInput, UpdateUserInput } from './dto/user.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly storage: StorageService,
  ) {}

  async createUser(input: CreateUserInput): Promise<UserEntity> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictException('errors.email_in_use');

    const roleName = input.roleName ?? DEFAULT_ROLE_NAME;
    await this.resolveRole(roleName);
    if (input.permissionNames?.length) {
      await this.resolvePermissions(input.permissionNames);
    }

    const user = await this.users.createWithPermissions({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      role: { connect: { name: roleName } },
      permissions: input.permissionNames
        ? { connect: input.permissionNames.map((name) => ({ name })) }
        : undefined,
      isActive: true,
      emailVerifiedAt: new Date(),
    });

    await this.permissions.invalidate(user.id);
    return user as UserEntity;
  }

  getUsers(
    filter?: UserFilterInput,
    orderBy?: UserOrderInput,
    pagination?: PaginationInput,
  ) {
    const where = buildUserWhere(filter);
    const order = buildUserOrderBy(orderBy);

    return offsetPaginate(
      (args) => this.users.findMany({ ...args, where, orderBy: order }),
      () => this.users.count(where),
      pagination,
    );
  }

  getMyProfile() {
    const uniqueId = RequestContext.getUserUniqueId();
    if (!uniqueId) throw new UnauthorizedException();
    return this.users.findByUniqueId(uniqueId);
  }

  async updateUser(
    uniqueId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<UserEntity> {
    const { roleName, permissionNames, avatarUniqueId, ...profileFields } =
      updateUserInput;

    if (roleName !== undefined) await this.resolveRole(roleName);
    if (permissionNames?.length) await this.resolvePermissions(permissionNames);

    let avatarUpdate: { avatar: { connect: { uniqueId: string } } } | undefined;
    if (avatarUniqueId !== undefined) {
      const newFile = await this.prisma.db.file.findUnique({
        where: { uniqueId: avatarUniqueId },
      });
      if (!newFile) throw new NotFoundException('errors.record_not_found');

      const current = await this.users.findByUniqueId(uniqueId);
      if (current?.avatar) {
        await this.storage.deleteFile(current.avatar.uniqueId);
      }

      avatarUpdate = { avatar: { connect: { uniqueId: avatarUniqueId } } };
    }

    const user = await this.users.updateByUniqueId(uniqueId, {
      ...profileFields,
      ...avatarUpdate,
      ...(roleName !== undefined && {
        role: { connect: { name: roleName } },
      }),
      ...(permissionNames != null && {
        permissions: { set: permissionNames.map((name) => ({ name })) },
      }),
    });

    if (roleName != null || permissionNames != null) {
      await this.permissions.invalidate(user.id);
    }

    return user as UserEntity;
  }

  async deleteUser(uniqueId: string): Promise<void> {
    return this.users.softDelete(uniqueId);
  }

  async activate(uniqueId: string): Promise<void> {
    return this.users.activate(uniqueId);
  }

  async deactivate(uniqueId: string): Promise<void> {
    return this.users.deactivate(uniqueId);
  }

  async restoreUser(uniqueId: string): Promise<void> {
    return this.users.restore(uniqueId);
  }

  async assignRole(
    userUniqueId: string,
    roleName: string,
  ): Promise<UserEntity> {
    await this.resolveRole(roleName);
    const user = await this.users.updateByUniqueId(userUniqueId, {
      role: { connect: { name: roleName } },
    });
    await this.permissions.invalidate(user.id);
    return user as UserEntity;
  }

  async setPermissions(
    userUniqueId: string,
    permissionNames: string[],
  ): Promise<UserEntity> {
    if (permissionNames.length) await this.resolvePermissions(permissionNames);
    const user = await this.users.updateByUniqueId(userUniqueId, {
      permissions: { set: permissionNames.map((name) => ({ name })) },
    });
    await this.permissions.invalidate(user.id);
    return user as UserEntity;
  }

  private async resolveRole(roleName: string): Promise<void> {
    const role = await this.prisma.db.role.findUnique({
      where: { name: roleName },
    });
    if (!role)
      throw new NotFoundException({
        message: 'errors.role_not_found',
        args: { role: roleName },
      });
  }

  private async resolvePermissions(names: string[]): Promise<void> {
    const found = await this.prisma.db.permission.findMany({
      where: { name: { in: names } },
      select: { name: true },
    });
    if (found.length === names.length) return;
    const missing = names.filter((n) => !found.some((p) => p.name === n));
    throw new BadRequestException({
      message: 'errors.permissions_not_found',
      args: { permissions: missing.join(', ') },
    });
  }
}
