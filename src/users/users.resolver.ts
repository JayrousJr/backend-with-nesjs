import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import {
  ADMIN_ROLE_NAME,
  PERMISSIONS,
  PermissionEntity,
  RequirePermission,
} from '@permissions';
import { PaginationInput } from '@common';
import { UserFilterInput, UserOrderInput } from './dto/user-filter';
import { UsersService } from './users.service';
import { UsersRepository } from './user.repository';
import { UserEntity } from './entities/user.entity';
import { UserListResponse, UserMutationResponse } from './dto/user-responses';
import {
  AssignUserRoleInput,
  CreateUserInput,
  SetUserPermissionsInput,
  UpdateUserInput,
} from './dto/user.types';
import {
  createMessageResponse,
  IMessageMutationResponse,
} from '@common/dto/mutation-response.type';

const DeleteUserResponse = createMessageResponse('DeleteUserResponse');

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
  ) {}
  /**
   * Require permission gate takes the two arguments for the specific permission that can access the resource and/or
   * the role that can also access the same resource.
   * This grants teh access permission for the user that has the specified permission or has the role specified.
   * @RequirePermission(PERMISSIONS.PERMISSIONS.MANAGE, ['SUPER_ADMIN'])
   *
   * Another gate is Role Gate that checks specifically for the role and allow or forbid the access to the resource
   * @RequireRole('ADMIN', 'SUPPORT')
   */
  @Query(() => UserEntity, { name: 'me' })
  me() {
    return this.usersService.getMyProfile();
  }

  @RequirePermission(PERMISSIONS.USERS.READ)
  @Query(() => UserListResponse, { name: 'getUsers' })
  getAllUsers(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', { type: () => UserFilterInput, nullable: true })
    filter?: UserFilterInput,
    @Args('orderBy', { type: () => UserOrderInput, nullable: true })
    orderBy?: UserOrderInput,
  ) {
    return this.usersService.getUsers(filter, orderBy, pagination);
  }

  @RequirePermission(PERMISSIONS.USERS.CREATE, [ADMIN_ROLE_NAME])
  @Mutation(() => UserMutationResponse)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<UserMutationResponse> {
    const data = await this.usersService.createUser(createUserInput);
    return { data, message: 'success.CREATE_USER' };
  }

  @RequirePermission(PERMISSIONS.USERS.UPDATE)
  @Mutation(() => UserMutationResponse)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<UserMutationResponse> {
    const data = await this.usersService.updateUser(
      updateUserInput.uniqueId!,
      updateUserInput,
    );
    return { data, message: 'success.UPDATE_USER' };
  }

  @RequirePermission(PERMISSIONS.USERS.DELETE)
  @Mutation(() => DeleteUserResponse)
  async deleteUser(
    @Args('uniqueId', { type: () => String }) uniqueId: string,
  ): Promise<IMessageMutationResponse> {
    await this.usersService.deleteUser(uniqueId);
    return { message: 'success.DELETE_USER' };
  }

  @RequirePermission(PERMISSIONS.ROLES.MANAGE, [ADMIN_ROLE_NAME])
  @Mutation(() => UserMutationResponse)
  async assignUserRole(
    @Args('assignUserRoleInput') input: AssignUserRoleInput,
  ): Promise<UserMutationResponse> {
    const data = await this.usersService.assignRole(
      input.userUniqueId,
      input.roleName,
    );
    return { data, message: 'success.ROLE_ASSIGN' };
  }

  @RequirePermission(PERMISSIONS.PERMISSIONS.MANAGE, [ADMIN_ROLE_NAME])
  @Mutation(() => UserMutationResponse)
  async setUserPermissions(
    @Args('setUserPermissionsInput') input: SetUserPermissionsInput,
  ): Promise<UserMutationResponse> {
    const data = await this.usersService.setPermissions(
      input.userUniqueId,
      input.permissionNames,
    );
    return { data, message: 'success.PERMISSION_UPDATE' };
  }

  @ResolveField(() => [PermissionEntity])
  async permissions(@Parent() user: UserEntity) {
    return this.usersRepository.findPermissionsByUserId(user.id);
  }

  @ResolveField(() => [PermissionEntity])
  async allPermissions(@Parent() user: UserEntity) {
    const [rolePerms, directPerms] = await Promise.all([
      this.usersRepository.findRolePermissionsByUserId(user.id),
      this.usersRepository.findPermissionsByUserId(user.id),
    ]);
    const seen = new Set<string>();
    const merged: PermissionEntity[] = [];
    for (const p of [...rolePerms, ...directPerms]) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        merged.push(p);
      }
    }
    return merged;
  }
}
