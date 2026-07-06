import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class CreateCampaignInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  subject!: string;

  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  bodyHtml!: string;

  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  bodyText!: string;
}

@InputType()
export class UpdateCampaignInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  uniqueId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  subject?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  bodyHtml?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  bodyText?: string;
}

@InputType()
export class ScheduleCampaignInput {
  @Field(() => String)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  uniqueId!: string;

  @Field(() => Date)
  @IsDate({ message: i18nValidationMessage('validation.isDate') })
  scheduledAt!: Date;
}
