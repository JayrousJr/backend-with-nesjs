import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(OrderDirection, { name: 'OrderDirection' });

@InputType()
export class DateRangeInput {
  @IsOptional()
  @Field(() => Date, { nullable: true })
  from?: Date;

  @IsOptional()
  @Field(() => Date, { nullable: true })
  to?: Date;
}

@InputType()
export class BaseFilterInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  uniqueId?: string;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  isDeleted?: boolean;

  @IsOptional()
  @Field(() => DateRangeInput, { nullable: true })
  createdAt?: DateRangeInput;

  @IsOptional()
  @Field(() => DateRangeInput, { nullable: true })
  updatedAt?: DateRangeInput;
}
