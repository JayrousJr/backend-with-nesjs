import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAIL_QUEUE } from './mail.constants';

export interface VerificationEmailJob {
  email: string;
  firstName: string;
  token: string;
  locale: string;
}

export interface PasswordResetEmailJob {
  email: string;
  firstName: string;
  token: string;
  locale: string;
}

export interface CampaignEmailJob {
  email: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  campaignRecipientId: number;
}

export interface NewsletterConfirmationJob {
  email: string;
  firstName: string;
  locale: string;
  type: 'subscribe' | 'unsubscribe';
}

@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue) {}

  async queueVerificationEmail(data: VerificationEmailJob): Promise<void> {
    await this.queue.add('verification-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  async queuePasswordResetEmail(data: PasswordResetEmailJob): Promise<void> {
    await this.queue.add('password-reset-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  async queueCampaignEmail(data: CampaignEmailJob): Promise<void> {
    await this.queue.add('campaign-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  async queueNewsletterConfirmation(
    data: NewsletterConfirmationJob,
  ): Promise<void> {
    await this.queue.add('newsletter-confirmation', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
