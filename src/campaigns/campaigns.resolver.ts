import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PERMISSIONS, RequirePermission } from '@permissions';
import { PaginationInput } from '@common';
import {
  createMessageResponse,
  IMessageMutationResponse,
} from '@common/dto/mutation-response.type';
import { CampaignsService } from './campaigns.service';
import { CampaignEntity } from './entities/campaign.entity';
import {
  CampaignMutationResponse,
  CampaignListResponse,
  CampaignRecipientListResponse,
} from './dto/campaign.responses';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  ScheduleCampaignInput,
} from './dto/campaign.types';
import {
  CampaignFilterInput,
  CampaignOrderInput,
} from './dto/campaign.filters';
import { CampaignRecipientFilterInput } from './dto/campaign-recipient.filter';

const DeleteCampaignResponse = createMessageResponse('DeleteCampaignResponse');

@Resolver(() => CampaignEntity)
export class CampaignsResolver {
  constructor(private readonly campaignsService: CampaignsService) {}

  @RequirePermission(PERMISSIONS.CAMPAIGNS.READ)
  @Query(() => CampaignListResponse, { name: 'getCampaigns' })
  getCampaigns(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', { type: () => CampaignFilterInput, nullable: true })
    filter?: CampaignFilterInput,
    @Args('orderBy', { type: () => CampaignOrderInput, nullable: true })
    orderBy?: CampaignOrderInput,
  ) {
    return this.campaignsService.getCampaigns(filter, orderBy, pagination);
  }

  @RequirePermission(PERMISSIONS.CAMPAIGNS.READ)
  @Query(() => CampaignEntity, { name: 'getCampaign' })
  getCampaign(@Args('uniqueId', { type: () => String }) uniqueId: string) {
    return this.campaignsService.getCampaign(uniqueId);
  }

  @RequirePermission(PERMISSIONS.CAMPAIGNS.READ)
  @Query(() => CampaignRecipientListResponse, { name: 'getCampaignRecipients' })
  getCampaignRecipients(
    @Args('campaignUniqueId', { type: () => String }) campaignUniqueId: string,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', {
      type: () => CampaignRecipientFilterInput,
      nullable: true,
    })
    filter?: CampaignRecipientFilterInput,
  ) {
    return this.campaignsService.getCampaignRecipients(
      campaignUniqueId,
      filter,
      pagination,
    );
  }

  @RequirePermission(PERMISSIONS.CAMPAIGNS.MANAGE)
  @Mutation(() => CampaignMutationResponse)
  async createCampaign(
    @Args('input') input: CreateCampaignInput,
  ): Promise<CampaignMutationResponse> {
    const data = await this.campaignsService.createCampaign(input);
    return { data, message: 'success.CAMPAIGN_CREATE' };
  }

  @RequirePermission(PERMISSIONS.CAMPAIGNS.MANAGE)
  @Mutation(() => CampaignMutationResponse)
  async updateCampaign(
    @Args('input') input: UpdateCampaignInput,
  ): Promise<CampaignMutationResponse> {
    const data = await this.campaignsService.updateCampaign(input);
    return { data, message: 'success.CAMPAIGN_UPDATE' };
  }

  @RequirePermission(PERMISSIONS.CAMPAIGNS.MANAGE)
  @Mutation(() => DeleteCampaignResponse)
  async deleteCampaign(
    @Args('uniqueId', { type: () => String }) uniqueId: string,
  ): Promise<IMessageMutationResponse> {
    await this.campaignsService.deleteCampaign(uniqueId);
    return { message: 'success.CAMPAIGN_DELETE' };
  }

  @RequirePermission(PERMISSIONS.CAMPAIGNS.MANAGE)
  @Mutation(() => CampaignMutationResponse)
  async sendCampaign(
    @Args('uniqueId', { type: () => String }) uniqueId: string,
  ): Promise<CampaignMutationResponse> {
    const data = await this.campaignsService.sendCampaign(uniqueId);
    return { data, message: 'success.CAMPAIGN_SEND' };
  }

  @RequirePermission(PERMISSIONS.CAMPAIGNS.MANAGE)
  @Mutation(() => CampaignMutationResponse)
  async scheduleCampaign(
    @Args('input') input: ScheduleCampaignInput,
  ): Promise<CampaignMutationResponse> {
    const data = await this.campaignsService.scheduleCampaign(
      input.uniqueId,
      input.scheduledAt,
    );
    return { data, message: 'success.CAMPAIGN_SCHEDULE' };
  }
}
