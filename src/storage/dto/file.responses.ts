import { ObjectType } from '@nestjs/graphql';
import { MutationResponse, QueryListResponse } from '@common';
import { FileEntity } from '../entities/file.entity';

@ObjectType()
export class FileMutationResponse extends MutationResponse(FileEntity) {}

@ObjectType()
export class FileListResponse extends QueryListResponse(FileEntity) {}
