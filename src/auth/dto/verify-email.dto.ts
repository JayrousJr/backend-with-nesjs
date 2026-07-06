import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class VerifyEmailDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  token: string;
}
