import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS, RequirePermission, RoleEntity } from '@permissions';
import { PaginationInput } from '@common';
import {
  createMessageResponse,
  IMessageMutationResponse,
} from '@common/dto/mutation-response.type';
import { RolesService } from './roles.service';
import { CreateRoleInput, UpdateRoleInput } from './dto/role.types';
import { RoleFilterInput, RoleOrderInput } from './dto/role.filters';
import { RoleListResponse, RoleMutationResponse } from './dto/role.responses';

const DeleteRoleResponse = createMessageResponse('DeleteRoleResponse');

@Resolver(() => RoleEntity)
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermission(PERMISSIONS.ROLES.READ)
  @Query(() => RoleListResponse, { name: 'getRoles' })
  getRoles(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', { type: () => RoleFilterInput, nullable: true })
    filter?: RoleFilterInput,
    @Args('orderBy', { type: () => RoleOrderInput, nullable: true })
    orderBy?: RoleOrderInput,
  ) {
    return this.rolesService.getRoles(filter, orderBy, pagination);
  }

  @RequirePermission(PERMISSIONS.ROLES.MANAGE)
  @Mutation(() => RoleMutationResponse)
  async createRole(@Args('createRoleInput') input: CreateRoleInput) {
    const data = await this.rolesService.createRole(input);
    return { data, message: 'success.ROLE_CREATE' };
  }

  @RequirePermission(PERMISSIONS.ROLES.MANAGE)
  @Mutation(() => RoleMutationResponse)
  async updateRole(@Args('updateRoleInput') input: UpdateRoleInput) {
    const data = await this.rolesService.updateRole(input);
    return { data, message: 'success.ROLE_UPDATE' };
  }

  @RequirePermission(PERMISSIONS.ROLES.MANAGE)
  @Mutation(() => DeleteRoleResponse)
  async deleteRole(
    @Args('uniqueId', { type: () => String }) uniqueId: string,
  ): Promise<IMessageMutationResponse> {
    await this.rolesService.deleteRole(uniqueId);
    return { message: 'success.ROLE_DELETE' };
  }
}
