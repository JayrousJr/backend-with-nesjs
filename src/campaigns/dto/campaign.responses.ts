import { ObjectType } from '@nestjs/graphql';
import { MutationResponse, QueryListResponse } from '@common';
import { CampaignEntity } from '../entities/campaign.entity';
import { CampaignRecipientEntity } from '../entities/campaign-recipient.entity';

@ObjectType()
export class CampaignMutationResponse extends MutationResponse(
  CampaignEntity,
) {}

@ObjectType()
export class CampaignListResponse extends QueryListResponse(CampaignEntity) {}

@ObjectType()
export class CampaignRecipientListResponse extends QueryListResponse(
  CampaignRecipientEntity,
) {}
