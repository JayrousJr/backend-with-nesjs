import { BaseRepository } from '@common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { Prisma } from '@db';

const USER_INCLUDE = { role: true, avatar: true } as const;

export type UserWithRole = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

export type UserWithRoleAndPermissions = UserWithRole;

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate() {
    return this.prisma.db.user;
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithRole> {
    return this.execute(this.delegate.create({ data, include: USER_INCLUDE }));
  }

  async createWithPermissions(
    data: Prisma.UserCreateInput,
  ): Promise<UserWithRoleAndPermissions> {
    return this.execute(
      this.delegate.create({
        data,
        include: USER_INCLUDE,
      }),
    );
  }

  async findMany(args: {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<UserWithRole[]> {
    return this.execute(
      this.delegate.findMany({ ...args, include: USER_INCLUDE }),
    );
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.execute(this.delegate.count({ where }));
  }

  async findByEmail(email: string): Promise<UserWithRole | null> {
    return this.execute(
      this.delegate.findFirst({ where: { email }, include: USER_INCLUDE }),
    );
  }

  async findByUniqueId(uniqueId: string): Promise<UserWithRole | null> {
    return this.execute(
      this.delegate.findFirst({
        where: { uniqueId },
        include: USER_INCLUDE,
      }),
    );
  }

  async updateByUniqueId(
    uniqueId: string,
    data: Prisma.UserUpdateInput,
  ): Promise<UserWithRoleAndPermissions> {
    return this.execute(
      this.delegate.update({
        where: { uniqueId },
        data,
        include: USER_INCLUDE,
      }),
    );
  }

  async findByVerificationToken(
    tokenHash: string,
  ): Promise<UserWithRole | null> {
    return this.execute(
      this.delegate.findFirst({
        where: { verificationToken: tokenHash },
        include: USER_INCLUDE,
      }),
    );
  }

  async verifyEmail(uniqueId: string): Promise<UserWithRole> {
    return this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: {
          emailVerifiedAt: new Date(),
          isActive: true,
          verificationToken: null,
          verificationExpiresAt: null,
        },
        include: USER_INCLUDE,
      }),
    );
  }

  async findByPasswordResetToken(
    tokenHash: string,
  ): Promise<UserWithRole | null> {
    return this.execute(
      this.delegate.findFirst({
        where: { passwordResetToken: tokenHash },
        include: USER_INCLUDE,
      }),
    );
  }

  async setPasswordResetToken(
    uniqueId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: {
          passwordResetToken: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      }),
    );
  }

  async resetPassword(uniqueId: string, password: string): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: {
          password,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      }),
    );
  }

  async updatePassword(uniqueId: string, password: string): Promise<void> {
    await this.execute(
      this.delegate.update({ where: { uniqueId }, data: { password } }),
    );
  }

  async setVerificationToken(
    uniqueId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: {
          verificationToken: tokenHash,
          verificationExpiresAt: expiresAt,
        },
      }),
    );
  }

  async incrementFailedLogins(uniqueId: string): Promise<UserWithRole> {
    return this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: { failedLoginAttempts: { increment: 1 } },
        include: USER_INCLUDE,
      }),
    );
  }

  async lockAccount(uniqueId: string, lockedUntil: Date): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: { lockedUntil },
      }),
    );
  }

  async resetLoginAttempts(uniqueId: string): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      }),
    );
  }

  async findPermissionsByUserId(userId: number) {
    const user = await this.execute(
      this.delegate.findUnique({
        where: { id: userId },
        include: { permissions: true },
      }),
    );
    return user?.permissions ?? [];
  }

  async findRolePermissionsByUserId(userId: number) {
    const user = await this.execute(
      this.delegate.findUnique({
        where: { id: userId },
        include: { role: { include: { permissions: true } } },
      }),
    );
    return user?.role?.permissions ?? [];
  }

  async deleteUnverifiedExpired(): Promise<{ count: number }> {
    return this.execute(
      this.delegate.deleteMany({
        where: {
          emailVerifiedAt: null,
          verificationExpiresAt: { lt: new Date() },
        },
      }),
    );
  }
}
