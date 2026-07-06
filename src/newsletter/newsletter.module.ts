import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NewsletterService } from './newsletter.service';
import { NewsletterResolver } from './newsletter.resolver';
import { NewsletterRepository } from './newsletter.repository';

@Module({
  imports: [MailModule],
  providers: [NewsletterResolver, NewsletterService, NewsletterRepository],
  exports: [NewsletterService, NewsletterRepository],
})
export class NewsletterModule {}
