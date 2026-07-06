import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { I18nService } from 'nestjs-i18n';
import { AppConfigService } from '@config';
import { PrismaService } from '@prisma';
import { MAIL_QUEUE } from './mail.constants';
import {
  CampaignEmailJob,
  NewsletterConfirmationJob,
  PasswordResetEmailJob,
  VerificationEmailJob,
} from './mail.service';
import { verificationEmailTemplate } from './templates/verification-email.template';
import { passwordResetEmailTemplate } from './templates/password-reset-email.template';
import { campaignEmailTemplate } from './templates/campaign-email.template';
import { newsletterConfirmationTemplate } from './templates/newsletter-confirmation.template';

interface MailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly sendMail: (payload: MailPayload) => Promise<void>;

  constructor(
    private readonly config: AppConfigService,
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
  ) {
    super();

    const mailer = this.config.mail.mailer;

    if (mailer === 'smtp' && this.config.mail.host) {
      const transporter = nodemailer.createTransport({
        host: this.config.mail.host,
        port: Number(this.config.mail.port) || 465,
        secure: this.config.mail.encryption?.toUpperCase() === 'SSL',
        auth: {
          user: this.config.mail.user,
          pass: this.config.mail.password,
        },
        pool: true,
        maxConnections: 5,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 30_000,
      });
      const from = this.config.mail.from;
      this.sendMail = async (payload) => {
        await transporter.sendMail({ from, ...payload });
      };
      this.logger.log(`Mail transport: SMTP (${this.config.mail.host})`);
    } else if (this.config.resend.apiKey) {
      const resend = new Resend(this.config.resend.apiKey);
      const from = this.config.resend.from;
      this.sendMail = async (payload) => {
        await resend.emails.send({ from, ...payload });
      };
      this.logger.log('Mail transport: Resend');
    } else {
      this.sendMail = (payload) => {
        this.logger.warn(`No mail transport — skipping email to ${payload.to}`);
        return Promise.resolve();
      };
      this.logger.warn(
        'No mail transport configured (set MAIL_MAILER=smtp or RESEND_API_KEY)',
      );
    }
  }

  private t(key: string, lang: string, args?: Record<string, unknown>): string {
    return this.i18n.translate(key, { lang, args });
  }

  async process(
    job: Job<
      | VerificationEmailJob
      | PasswordResetEmailJob
      | CampaignEmailJob
      | NewsletterConfirmationJob
    >,
  ): Promise<void> {
    if (job.name === 'campaign-email') {
      return this.processCampaignEmail(job as Job<CampaignEmailJob>);
    }

    if (job.name === 'newsletter-confirmation') {
      return this.processNewsletterConfirmation(
        job as Job<NewsletterConfirmationJob>,
      );
    }

    const { email, firstName, token, locale } =
      job.data as VerificationEmailJob;
    const lang = locale || 'en';
    let subject: string, html: string, text: string;

    if (job.name === 'verification-email') {
      subject = this.t('mail.verification.subject', lang);
      ({ html, text } = verificationEmailTemplate({
        verificationUrl: `${this.config.appUrl}/auth/verify-email?token=${token}`,
        greeting: this.t('mail.verification.greeting', lang, { firstName }),
        body: this.t('mail.verification.body', lang),
        cta: this.t('mail.verification.cta', lang),
        expiry: this.t('mail.verification.expiry', lang),
        ignore: this.t('mail.verification.ignore', lang),
      }));
    } else if (job.name === 'password-reset-email') {
      subject = this.t('mail.password_reset.subject', lang);
      ({ html, text } = passwordResetEmailTemplate({
        resetUrl: `${this.config.frontendUrl}/auth/reset-password?token=${token}`,
        greeting: this.t('mail.password_reset.greeting', lang, { firstName }),
        body: this.t('mail.password_reset.body', lang),
        cta: this.t('mail.password_reset.cta', lang),
        expiry: this.t('mail.password_reset.expiry', lang),
        ignore: this.t('mail.password_reset.ignore', lang),
      }));
    } else {
      return;
    }

    await this.sendMail({ to: email, subject, html, text });
    this.logger.log(`Sent ${job.name} to ${email} [${lang}]`);
  }

  private async processCampaignEmail(
    job: Job<CampaignEmailJob>,
  ): Promise<void> {
    const { email, subject, bodyHtml, bodyText, campaignRecipientId } =
      job.data;

    try {
      const { html, text } = campaignEmailTemplate({ bodyHtml, bodyText });
      await this.sendMail({ to: email, subject, html, text });

      await this.prisma.db.campaignRecipient.update({
        where: { id: campaignRecipientId },
        data: { status: 'SENT', sentAt: new Date() },
      });

      this.logger.log(`Sent campaign email to ${email}`);
    } catch (error) {
      await this.prisma.db.campaignRecipient.update({
        where: { id: campaignRecipientId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  private async processNewsletterConfirmation(
    job: Job<NewsletterConfirmationJob>,
  ): Promise<void> {
    const { email, firstName, locale, type } = job.data;
    const lang = locale || 'en';

    const subject = this.t(`mail.newsletter.${type}_subject`, lang);
    const { html, text } = newsletterConfirmationTemplate({
      greeting: this.t(`mail.newsletter.${type}_greeting`, lang, { firstName }),
      body: this.t(`mail.newsletter.${type}_body`, lang),
    });

    await this.sendMail({ to: email, subject, html, text });
    this.logger.log(
      `Sent newsletter ${type} confirmation to ${email} [${lang}]`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Mail job ${job.id} (${job.name}) failed: ${error.message}`,
    );
  }
}
