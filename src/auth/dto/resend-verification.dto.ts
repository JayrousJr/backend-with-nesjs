import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  email: string;
}
