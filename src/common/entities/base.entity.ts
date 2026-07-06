import { Field, HideField, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
export abstract class BaseEntity {
  @HideField()
  id: number;

  @Field(() => String)
  uniqueId: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @HideField()
  isDeleted: boolean;

  @HideField()
  deletedAt?: Date | null;

  @HideField()
  createdById?: number | null;

  @HideField()
  updatedById?: number | null;

  @HideField()
  deletedById?: number | null;
}
