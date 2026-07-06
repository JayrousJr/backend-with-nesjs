import { Field, InputType, PartialType } from '@nestjs/graphql';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsLocale,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  email!: string;

  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  password!: string;

  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  firstName!: string;

  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  lastName!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Role to assign. Defaults to the standard user role.',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  roleName?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Direct permissions to grant in addition to the role.',
  })
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
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => String, { nullable: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  uniqueId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  firstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  lastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  email?: string;

  @Field(() => String, {
    nullable: true,
    description: 'BCP 47 locale tag (e.g. en, sw, fr)',
  })
  @IsOptional()
  @IsLocale({ message: i18nValidationMessage('validation.isString') })
  preferredLocale?: string;

  @Field(() => String, {
    nullable: true,
    description: 'UniqueId of an uploaded file to set as avatar',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  avatarUniqueId?: string;
}

@InputType()
export class AssignUserRoleInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  userUniqueId!: string;

  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  roleName!: string;
}

@InputType()
export class SetUserPermissionsInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  userUniqueId!: string;

  @Field(() => [String])
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ArrayUnique({ message: i18nValidationMessage('validation.arrayUnique') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.isString'),
  })
  permissionNames!: string[];
}
