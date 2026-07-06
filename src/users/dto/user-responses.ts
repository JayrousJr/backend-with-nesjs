import { ObjectType } from '@nestjs/graphql';
import { MutationResponse, QueryListResponse } from '@common';
import { UserEntity } from '../entities/user.entity';

@ObjectType()
export class UserMutationResponse extends MutationResponse(UserEntity) {}

@ObjectType()
export class UserListResponse extends QueryListResponse(UserEntity) {}
