import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersRepository } from '../users/user.repository';

@Injectable()
export class AccountCleanupService {
  private readonly logger = new Logger(AccountCleanupService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async removeExpiredUnverifiedAccounts(): Promise<void> {
    const { count } = await this.usersRepository.deleteUnverifiedExpired();
    if (count > 0) {
      this.logger.log(
        `Deleted ${count} unverified account(s) past the 7-day verification window`,
      );
    }
  }
}
