import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '@config';
import { PrismaService } from '@prisma';
import { RetentionService } from './retention.service';
import { StorageService } from '../storage/storage.service';

describe('RetentionService', () => {
  let service: RetentionService;

  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const dbRaw = {
    session: { deleteMany },
    user: { deleteMany },
    campaign: { deleteMany },
    campaignRecipient: { deleteMany },
    newsletterSubscriber: { deleteMany },
    permission: { deleteMany },
    role: { deleteMany },
    pageView: { deleteMany },
  };
  const storage = { purgeSoftDeletedBefore: jest.fn().mockResolvedValue(0) };
  const retention = { softDeletedDays: 30, pageViewDays: 90 };

  beforeEach(async () => {
    deleteMany.mockClear();
    storage.purgeSoftDeletedBefore.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionService,
        { provide: PrismaService, useValue: { dbRaw } },
        { provide: AppConfigService, useValue: { retention } },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<RetentionService>(RetentionService);
  });

  it('purges soft-deleted rows on every audited model, delegating files to storage', async () => {
    await service.purgeSoftDeleted();
    // 7 bulk models (user, campaign, recipient, subscriber, session,
    // permission, role) + files via the storage driver.
    expect(deleteMany).toHaveBeenCalledTimes(7);
    expect(storage.purgeSoftDeletedBefore).toHaveBeenCalledTimes(1);
  });

  it('skips roles that still have users assigned (Restrict FK)', async () => {
    await service.purgeSoftDeleted();
    expect(deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ users: { none: {} } }),
      }),
    );
  });

  it('does nothing when the soft-delete window is 0 (disabled)', async () => {
    retention.softDeletedDays = 0;
    await service.purgeSoftDeleted();
    expect(deleteMany).not.toHaveBeenCalled();
    expect(storage.purgeSoftDeletedBefore).not.toHaveBeenCalled();
    retention.softDeletedDays = 30;
  });

  it('prunes raw page views older than the window', async () => {
    await service.prunePageViews();
    expect(deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });

  it('purges expired sessions', async () => {
    await service.purgeExpiredSessions();
    expect(deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });
});
