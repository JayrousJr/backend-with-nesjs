import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  email: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  password: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  firstName: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  lastName: string;
}
