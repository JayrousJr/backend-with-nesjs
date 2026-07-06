import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class TrackPageViewInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  path!: string;

  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  sessionId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  referrer?: string;
}
