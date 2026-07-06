import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class RegisterUserInput {
  @Field(() => String, { nullable: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  firstName: string;

  @Field(() => String, { nullable: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  lastName: string;

  @Field(() => String, { nullable: false })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  email: string;

  @Field(() => String, { nullable: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  password: string;
}
