import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestContext, offsetPaginate, PaginationInput } from '@common';
import { PrismaService } from '@prisma';
import { NewsletterRepository } from './newsletter.repository';
import { MailService } from '../mail/mail.service';
import {
  NewsletterSubscriberFilterInput,
  buildNewsletterSubscriberWhere,
} from './dto/newsletter-subscriber.filter';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly newsletter: NewsletterRepository,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async getSubscribers(
    filter?: NewsletterSubscriberFilterInput,
    pagination?: PaginationInput,
  ) {
    const where = buildNewsletterSubscriberWhere(filter);

    const result = await offsetPaginate(
      (args) => this.newsletter.findMany({ ...args, where }),
      () => this.newsletter.count(where),
      pagination,
    );

    return {
      ...result,
      data: result.data.map((subscriber) => ({
        ...subscriber,
        email: subscriber.user.email,
        firstName: subscriber.user.firstName,
        lastName: subscriber.user.lastName,
      })),
    };
  }

  async getMySubscription() {
    const user = RequestContext.getUser();
    if (!user) throw new UnauthorizedException();
    return this.newsletter.findByUserId(user.id);
  }

  async subscribe() {
    const user = RequestContext.getUser();
    if (!user) throw new UnauthorizedException();

    const isActiveSubUser = await this.newsletter.checkActiveSubscribedUser(
      user.id,
    );

    if (isActiveSubUser)
      throw new BadRequestException('errors.already_subscribed');

    const subscriber = await this.newsletter.upsertByUserId(user.id, {
      isActive: true,
      isDeleted: false,
    });

    const dbUser = await this.prisma.db.user.findFirst({
      where: { id: user.id },
      select: { firstName: true },
    });

    await this.mail.queueNewsletterConfirmation({
      email: user.email,
      firstName: dbUser?.firstName ?? '',
      locale: user.preferredLocale,
      type: 'subscribe',
    });

    return subscriber;
  }

  async unsubscribe() {
    const user = RequestContext.getUser();
    if (!user) throw new UnauthorizedException();

    const isInActiveSubUser = await this.newsletter.checkInActiveSubscribedUser(
      user.id,
    );

    if (isInActiveSubUser)
      throw new BadRequestException('errors.already_unsubscribed');

    const subscriber = await this.newsletter.updateByUserId(user.id, {
      isActive: false,
    });

    const dbUser = await this.prisma.db.user.findFirst({
      where: { id: user.id },
      select: { firstName: true },
    });

    await this.mail.queueNewsletterConfirmation({
      email: user.email,
      firstName: dbUser?.firstName ?? '',
      locale: user.preferredLocale,
      type: 'unsubscribe',
    });

    return subscriber;
  }
}
