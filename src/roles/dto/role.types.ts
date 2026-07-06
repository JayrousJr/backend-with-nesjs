import { Field, InputType } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class CreateRoleInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  description?: string | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ArrayUnique({ message: i18nValidationMessage('validation.arrayUnique') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.isString'),
  })
  permissionNames?: string[];
}

@InputType()
export class UpdateRoleInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  uniqueId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  description?: string | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ArrayUnique({ message: i18nValidationMessage('validation.arrayUnique') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.isString'),
  })
  permissionNames?: string[];
}
