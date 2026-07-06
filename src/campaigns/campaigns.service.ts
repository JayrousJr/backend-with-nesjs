import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginationInput, offsetPaginate } from '@common';
import { PrismaService } from '@prisma';
import { CampaignRepository } from './campaign.repository';
import { CampaignRecipientRepository } from './campaign-recipient.repository';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCampaignInput, UpdateCampaignInput } from './dto/campaign.types';
import {
  CampaignFilterInput,
  CampaignOrderInput,
  buildCampaignWhere,
  buildCampaignOrderBy,
} from './dto/campaign.filters';
import {
  CampaignRecipientFilterInput,
  buildCampaignRecipientWhere,
} from './dto/campaign-recipient.filter';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly recipients: CampaignRecipientRepository,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Tell the campaign's creator how the send ended (in-app, real-time). */
  private async notifyCreator(
    campaign: {
      uniqueId: string;
      subject: string;
      createdById: number | null;
    },
    outcome: 'sent' | 'failed',
  ) {
    if (!campaign.createdById) return;
    await this.notificationsService.notify(campaign.createdById, {
      type: outcome === 'sent' ? 'SUCCESS' : 'ERROR',
      titleKey: `notifications.campaign_${outcome}_title`,
      messageKey: `notifications.campaign_${outcome}_message`,
      params: { subject: campaign.subject },
      link: `/campaigns/${campaign.uniqueId}`,
    });
  }

  getCampaigns(
    filter?: CampaignFilterInput,
    orderBy?: CampaignOrderInput,
    pagination?: PaginationInput,
  ) {
    const where = buildCampaignWhere(filter);
    const order = buildCampaignOrderBy(orderBy);

    return offsetPaginate(
      (args) => this.campaigns.findMany({ ...args, where, orderBy: order }),
      () => this.campaigns.count(where),
      pagination,
    );
  }

  async getCampaign(uniqueId: string) {
    const campaign = await this.campaigns.findByUniqueId(uniqueId);
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(input: CreateCampaignInput) {
    return this.campaigns.create({
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText,
    });
  }

  async updateCampaign(input: UpdateCampaignInput) {
    const campaign = await this.getCampaign(input.uniqueId);
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Only draft campaigns can be updated');
    }

    const { uniqueId, ...data } = input;
    return this.campaigns.updateByUniqueId(uniqueId, data);
  }

  async deleteCampaign(uniqueId: string) {
    await this.getCampaign(uniqueId);
    await this.campaigns.softDelete(uniqueId);
  }

  async sendCampaign(uniqueId: string) {
    const campaign = await this.getCampaign(uniqueId);
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Only draft or scheduled campaigns can be sent',
      );
    }

    await this.campaigns.updateByUniqueId(uniqueId, { status: 'SENDING' });

    try {
      await this.fanOutCampaign(
        campaign.id,
        campaign.subject,
        campaign.bodyHtml,
        campaign.bodyText,
      );
      await this.campaigns.updateByUniqueId(uniqueId, {
        status: 'SENT',
        sentAt: new Date(),
      });
      await this.notifyCreator(campaign, 'sent');
    } catch (error) {
      await this.campaigns.updateByUniqueId(uniqueId, { status: 'FAILED' });
      await this.notifyCreator(campaign, 'failed');
      throw error;
    }

    return this.getCampaign(uniqueId);
  }

  async getCampaignRecipients(
    campaignUniqueId: string,
    filter?: CampaignRecipientFilterInput,
    pagination?: PaginationInput,
  ) {
    const campaign = await this.getCampaign(campaignUniqueId);
    const where = buildCampaignRecipientWhere(campaign.id, filter);

    const result = await offsetPaginate(
      (args) => this.recipients.findMany({ ...args, where }),
      () => this.recipients.count(where),
      pagination,
    );

    return {
      ...result,
      data: result.data.map((recipient) => ({
        ...recipient,
        subscriberEmail: recipient.subscriber.user.email,
        subscriberFirstName: recipient.subscriber.user.firstName,
        subscriberLastName: recipient.subscriber.user.lastName,
      })),
    };
  }

  async scheduleCampaign(uniqueId: string, scheduledAt: Date) {
    const campaign = await this.getCampaign(uniqueId);
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Only draft campaigns can be scheduled');
    }

    return this.campaigns.updateByUniqueId(uniqueId, {
      status: 'SCHEDULED',
      scheduledAt,
    });
  }

  async fanOutCampaign(
    campaignId: number,
    subject: string,
    bodyHtml: string,
    bodyText: string,
  ) {
    const subscribers = await this.prisma.db.newsletterSubscriber.findMany({
      where: { isActive: true },
      include: { user: { select: { email: true } } },
    });

    if (subscribers.length === 0) {
      await this.prisma.db.campaign.update({
        where: { id: campaignId },
        data: { recipientCount: 0 },
      });
      return;
    }

    await this.recipients.createMany(
      subscribers.map((sub) => ({
        campaignId,
        subscriberId: sub.id,
        status: 'PENDING' as const,
      })),
    );

    const recipientRows = await this.recipients.findByCampaignId(campaignId);

    for (const recipient of recipientRows) {
      await this.mail.queueCampaignEmail({
        email: recipient.subscriber.user.email,
        subject,
        bodyHtml,
        bodyText,
        campaignRecipientId: recipient.id,
      });

      await this.recipients.updateStatus(recipient.id, 'QUEUED');
    }

    await this.prisma.db.campaign.update({
      where: { id: campaignId },
      data: { recipientCount: recipientRows.length },
    });
  }

  async processScheduledCampaigns() {
    const now = new Date();

    const scheduled = await this.prisma.db.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
        isDeleted: false,
      },
    });

    for (const campaign of scheduled) {
      const result = await this.prisma.dbRaw.campaign.updateMany({
        where: { id: campaign.id, status: 'SCHEDULED' },
        data: { status: 'SENDING' },
      });

      if (result.count === 0) continue;

      try {
        await this.fanOutCampaign(
          campaign.id,
          campaign.subject,
          campaign.bodyHtml,
          campaign.bodyText,
        );
        await this.prisma.db.campaign.update({
          where: { id: campaign.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        this.logger.log(`Scheduled campaign ${campaign.uniqueId} sent`);
        await this.notifyCreator(campaign, 'sent');
      } catch (error) {
        await this.prisma.db.campaign.update({
          where: { id: campaign.id },
          data: { status: 'FAILED' },
        });
        this.logger.error(
          `Scheduled campaign ${campaign.uniqueId} failed: ${error}`,
        );
        await this.notifyCreator(campaign, 'failed');
      }
    }
  }
}
