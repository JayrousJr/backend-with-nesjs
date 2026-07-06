import { MutationResponse, QueryListResponse } from '@common';
import { ObjectType } from '@nestjs/graphql';
import { RoleEntity } from '@permissions';

@ObjectType()
export class RoleMutationResponse extends MutationResponse(RoleEntity) {}

@ObjectType()
export class RoleListResponse extends QueryListResponse(RoleEntity) {}
