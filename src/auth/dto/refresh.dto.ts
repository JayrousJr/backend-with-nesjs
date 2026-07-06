import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RefreshDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  refreshToken: string;
}
