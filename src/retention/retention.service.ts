import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppConfigService } from '@config';
import { PrismaService } from '@prisma';
import { StorageService } from '../storage/storage.service';

/**
 * Central data-retention policy, run daily. Three concerns:
 *
 * 1. Soft-deleted rows — the `db` client's extension hides `isDeleted` rows
 *    from every query but nothing removes them, so without this purge every
 *    audited table (and the PII in it) grows forever. Rows are hard-deleted
 *    once `deletedAt` is older than RETENTION_SOFT_DELETED_DAYS.
 * 2. Expired sessions — every login creates one; expired rows are dead weight.
 * 3. Raw page views — `VisitorStat` already aggregates them daily, so the raw
 *    rows (which carry ipHash/userAgent) are pruned after
 *    RETENTION_PAGE_VIEWS_DAYS while the aggregates are kept forever.
 *
 * Unverified-account cleanup is separate (auth/account-cleanup.service.ts) —
 * its deadline is per-user (`verificationExpiresAt`), not a global window.
 *
 * All purges use `dbRaw` semantics (plain deleteMany is not intercepted by
 * the soft-delete extension) and are idempotent, so overlapping runs across
 * multiple app replicas are harmless. Set a window to 0 to disable that purge.
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly storage: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyCleanup(): Promise<void> {
    await this.purgeExpiredSessions();
    await this.purgeSoftDeleted();
    await this.prunePageViews();
  }

  async purgeExpiredSessions(): Promise<void> {
    const { count } = await this.prisma.dbRaw.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) this.logger.log(`Purged ${count} expired session(s)`);
  }

  async purgeSoftDeleted(): Promise<void> {
    const days = this.config.retention.softDeletedDays;
    if (days <= 0) return;

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deleted = { isDeleted: true, deletedAt: { lt: cutoff } };
    const db = this.prisma.dbRaw;

    // Order matters only loosely — FK cascades handle children (a purged user
    // takes their sessions/subscription along; a purged campaign takes its
    // recipients) — but parents-first keeps the counts honest.
    const results = {
      users: await db.user.deleteMany({ where: deleted }),
      campaigns: await db.campaign.deleteMany({ where: deleted }),
      campaignRecipients: await db.campaignRecipient.deleteMany({
        where: deleted,
      }),
      newsletterSubscribers: await db.newsletterSubscriber.deleteMany({
        where: deleted,
      }),
      sessions: await db.session.deleteMany({ where: deleted }),
      permissions: await db.permission.deleteMany({ where: deleted }),
      // User.role is a Restrict FK — a soft-deleted role still assigned to
      // users can't be purged until those users are gone or reassigned.
      roles: await db.role.deleteMany({
        where: { ...deleted, users: { none: {} } },
      }),
      files: { count: await this.storage.purgeSoftDeletedBefore(cutoff) },
    };

    const summary = Object.entries(results)
      .filter(([, { count }]) => count > 0)
      .map(([model, { count }]) => `${model}: ${count}`)
      .join(', ');
    if (summary) {
      this.logger.log(`Purged soft-deleted rows past ${days}d — ${summary}`);
    }
  }

  async prunePageViews(): Promise<void> {
    const days = this.config.retention.pageViewDays;
    if (days <= 0) return;

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.dbRaw.pageView.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) {
      this.logger.log(`Pruned ${count} raw page view(s) older than ${days}d`);
    }
  }
}
