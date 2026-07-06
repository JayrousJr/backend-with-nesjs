import { Field, ObjectType } from '@nestjs/graphql';
import type { Type } from '@nestjs/common';

export interface IMutationResponse<T> {
  message: string;
  data: T;
}
export interface IMessageMutationResponse {
  message: string;
}
export function MutationResponse<T>(
  DataType: Type<T>,
): Type<IMutationResponse<T>> {
  @ObjectType({ isAbstract: true })
  abstract class MutationResponseClass implements IMutationResponse<T> {
    @Field(() => String)
    message!: string;

    @Field(() => DataType)
    data!: T;
  }

  return MutationResponseClass as Type<IMutationResponse<T>>;
}

//  / Global registry map to prevent schema duplication crashes
const dynamicClassRegistry = new Map<string, any>();

export function createMessageResponse(
  name: string,
): Type<IMessageMutationResponse> {
  // Return cached type if already instantiated
  if (dynamicClassRegistry.has(name)) {
    return dynamicClassRegistry.get(name);
  }

  @ObjectType(name)
  class BaseMessageResponse implements IMessageMutationResponse {
    @Field(() => String)
    message!: string;
  }

  // Explicitly override class properties to satisfy compiler reflection
  Object.defineProperty(BaseMessageResponse, 'name', { value: name });

  dynamicClassRegistry.set(name, BaseMessageResponse);
  return BaseMessageResponse;
}
