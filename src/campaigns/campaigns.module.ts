import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { CampaignRepository } from './campaign.repository';
import { CampaignRecipientRepository } from './campaign-recipient.repository';
import { CampaignSchedulerService } from './campaign-scheduler.service';

@Module({
  imports: [MailModule, NotificationsModule],
  providers: [
    CampaignsResolver,
    CampaignsService,
    CampaignRepository,
    CampaignRecipientRepository,
    CampaignSchedulerService,
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}
