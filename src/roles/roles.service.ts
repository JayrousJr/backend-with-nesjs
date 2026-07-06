import { Injectable } from '@nestjs/common';
import { RolesRepository } from './role.repository';
import { CreateRoleInput, UpdateRoleInput } from './dto/role.types';
import {
  buildRoleOrderby,
  buildRoleWhere,
  RoleFilterInput,
  RoleOrderInput,
} from './dto/role.filters';
import { offsetPaginate, PaginationInput } from '@common';

@Injectable()
export class RolesService {
  constructor(private readonly roles: RolesRepository) {}

  async getRoles(
    filter?: RoleFilterInput,
    orderBy?: RoleOrderInput,
    pagination?: PaginationInput,
  ) {
    const where = buildRoleWhere(filter);
    const order = buildRoleOrderby(orderBy);
    return offsetPaginate(
      (args) => this.roles.findMany({ ...args, where, orderBy: order }),
      () => this.roles.count(where),
      pagination,
    );
  }

  async createRole(input: CreateRoleInput) {
    return this.roles.create(input);
  }

  async updateRole(input: UpdateRoleInput) {
    const { uniqueId, ...data } = input;
    return this.roles.updateByUniqueId(uniqueId, data);
  }

  async deleteRole(uniqueId: string): Promise<void> {
    return this.roles.softDelete(uniqueId);
  }
}
