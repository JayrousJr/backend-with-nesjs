import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { Prisma, CampaignRecipientStatus } from '@db';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class CampaignRecipientFilterInput {
  @IsOptional()
  @IsEnum(CampaignRecipientStatus, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @Field(() => CampaignRecipientStatus, { nullable: true })
  status?: CampaignRecipientStatus;
}

export function buildCampaignRecipientWhere(
  campaignId: number,
  filter?: CampaignRecipientFilterInput,
): Prisma.CampaignRecipientWhereInput {
  return {
    campaignId,
    ...(filter?.status && { status: filter.status }),
  };
}
