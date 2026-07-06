import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  token: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  password: string;
}
