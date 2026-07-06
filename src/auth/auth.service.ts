import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import ms from 'ms';
import { AppConfigService } from '@config';
import { DEFAULT_ROLE_NAME } from '@permissions';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { OAuthProfile } from './google-oauth.service';
import { UsersRepository, UserWithRole } from '../users/user.repository';
import { SessionsRepository } from './session.repository';
import { RegisterDto } from './dto/register.dto';
import { RegisterUserInput } from './dto/register-user.input';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './auth.types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export type SafeUser = Omit<
  UserWithRole,
  'password' | 'verificationToken' | 'passwordResetToken'
>;

const VERIFICATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    await this.createUser(dto);
    return {
      // user: this.sanitize(user),
      message: 'success.REGISTER',
    };
  }

  async registerUser(dto: RegisterUserInput): Promise<SafeUser> {
    const user = await this.createUser(dto);
    return this.sanitize(user);
  }

  private async createUser(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserWithRole> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('errors.email_in_use');
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_WINDOW_MS);

    const user = await this.usersRepository.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: { connect: { name: DEFAULT_ROLE_NAME } },
      isActive: false,
      verificationToken: tokenHash,
      verificationExpiresAt,
    });

    await this.mailService.queueVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      token,
      locale: user.preferredLocale,
    });

    this.logger.log(`Registered: ${user.email}`);
    return user;
  }

  async verifyEmail(token: string): Promise<SafeUser> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersRepository.findByVerificationToken(tokenHash);

    if (
      !user ||
      !user.verificationExpiresAt ||
      user.verificationExpiresAt < new Date()
    ) {
      throw new BadRequestException('errors.invalid_token');
    }

    const verified = await this.usersRepository.verifyEmail(user.uniqueId);
    this.logger.log(`Email verified: ${verified.email}`);

    // Welcome the user in-app; it's waiting for them on first login.
    await this.notificationsService.notify(verified.id, {
      type: 'SUCCESS',
      titleKey: 'notifications.welcome_title',
      messageKey: 'notifications.welcome_message',
      params: { firstName: verified.firstName },
    });

    return this.sanitize(verified);
  }

  async login(dto: LoginDto, metadata?: SessionMetadata): Promise<AuthTokens> {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      this.logger.warn(`Login blocked (locked): ${dto.email}`);
      throw new UnauthorizedException({
        message: 'errors.account_locked',
        args: { minutes },
      });
    }

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      if (user) {
        const updated = await this.usersRepository.incrementFailedLogins(
          user.uniqueId,
        );
        if (updated.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          await this.usersRepository.lockAccount(user.uniqueId, lockedUntil);
          this.logger.warn(
            `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts: ${dto.email}`,
          );
          throw new UnauthorizedException({
            message: 'errors.account_locked',
            args: { minutes: Math.ceil(LOCKOUT_DURATION_MS / 60_000) },
          });
        }
      }
      this.logger.warn(`Login failed: ${dto.email}`);
      throw new UnauthorizedException('errors.invalid_credentials');
    }

    if (!user.isActive) {
      this.logger.warn(`Login blocked (unverified): ${dto.email}`);
      throw new UnauthorizedException('errors.email_not_verified');
    }

    if (user.failedLoginAttempts > 0) {
      await this.usersRepository.resetLoginAttempts(user.uniqueId);
    }

    this.logger.log(`Login: ${user.email} [${user.role.name}]`);

    return { ...(await this.issueTokens(user, metadata)) };
  }

  /**
   * Sign in (or sign up) with an identity already verified by an OAuth
   * provider. Never touches the lockout counters — those protect password
   * guessing, and there is no password involved here.
   */
  async oauthLogin(
    profile: OAuthProfile,
    metadata?: SessionMetadata,
  ): Promise<AuthTokens> {
    let user = await this.usersRepository.findByEmail(profile.email);

    if (user && user.emailVerifiedAt && !user.isActive) {
      // Deactivated by an admin — OAuth must not resurrect the account.
      this.logger.warn(`OAuth login blocked (inactive): ${profile.email}`);
      throw new UnauthorizedException('errors.invalid_credentials');
    }

    if (user && !user.emailVerifiedAt) {
      // Registered with a password but never verified — the provider just
      // proved ownership of this email address.
      user = await this.usersRepository.verifyEmail(user.uniqueId);
    }

    if (!user) {
      if (!profile.emailVerified) {
        throw new UnauthorizedException('errors.oauth_failed');
      }
      user = await this.usersRepository.create({
        email: profile.email,
        // Random unusable password (hashed by the Prisma extension) — OAuth
        // users can set a real one later via "forgot password".
        password: randomBytes(32).toString('hex'),
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: { connect: { name: DEFAULT_ROLE_NAME } },
        isActive: true,
        emailVerifiedAt: new Date(),
      });
      this.logger.log(`Registered via OAuth: ${user.email}`);
      await this.notificationsService.notify(user.id, {
        type: 'SUCCESS',
        titleKey: 'notifications.welcome_title',
        messageKey: 'notifications.welcome_message',
        params: { firstName: user.firstName },
      });
    }

    this.logger.log(`OAuth login: ${user.email} [${user.role.name}]`);
    return this.issueTokens(user, metadata);
  }

  async refreshToken(
    refreshToken: string,
    metadata?: SessionMetadata,
  ): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const session = await this.sessionsRepository.findActiveByUniqueId(
      payload.sid,
    );
    if (!session) {
      throw new UnauthorizedException('errors.session_expired');
    }

    const user = await this.usersRepository.findByUniqueId(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('errors.user_not_found');
    }

    await this.sessionsRepository.revoke(session.uniqueId);

    return this.issueTokens(user, metadata);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.sessionsRepository.revoke(payload.sid);
    } catch {
      // Already invalid/expired/revoked — logout is idempotent either way.
    }
  }

  async logoutAll(userId: number): Promise<void> {
    await this.sessionsRepository.revokeAllForUser(userId);
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.jwtRefresh.secret,
      });
    } catch {
      throw new UnauthorizedException('errors.invalid_refresh_token');
    }
  }

  private async issueTokens(
    user: UserWithRole,
    metadata?: SessionMetadata,
  ): Promise<AuthTokens> {
    const refreshExpiresAt = new Date(
      Date.now() + ms(this.config.jwtRefresh.expiresIn as ms.StringValue),
    );
    const session = await this.sessionsRepository.create({
      userId: user.id,
      expiresAt: refreshExpiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    const payload: JwtPayload = {
      sub: user.uniqueId,
      email: user.email,
      role: user.role.name,
      sid: session.uniqueId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.jwtAccess.secret,
        expiresIn: this.config.jwtAccess
          .expiresIn as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.jwtRefresh.secret,
        expiresIn: this.config.jwtRefresh
          .expiresIn as JwtSignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user || !user.isActive) return;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_WINDOW_MS);

    await this.usersRepository.setPasswordResetToken(
      user.uniqueId,
      tokenHash,
      expiresAt,
    );

    await this.mailService.queuePasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      token,
      locale: user.preferredLocale,
    });

    this.logger.log(`Password reset initiated: ${user.email}`);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersRepository.findByPasswordResetToken(tokenHash);

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('errors.invalid_token');
    }

    if (await bcrypt.compare(password, user.password)) {
      throw new BadRequestException('errors.password_same_as_current');
    }

    await this.usersRepository.resetPassword(user.uniqueId, password);
    await this.sessionsRepository.revokeAllForUser(user.id);
    this.logger.log(`Password reset complete: ${user.email}`);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user || user.emailVerifiedAt) return;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_WINDOW_MS);

    await this.usersRepository.setVerificationToken(
      user.uniqueId,
      tokenHash,
      expiresAt,
    );

    await this.mailService.queueVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      token,
      locale: user.preferredLocale,
    });
  }

  async changePassword(
    userUniqueId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findByUniqueId(userUniqueId);
    if (!user) throw new UnauthorizedException('errors.user_not_found');

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      this.logger.warn(
        `Password change failed (wrong current password): ${user.email}`,
      );
      throw new UnauthorizedException('errors.current_password_incorrect');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException('errors.password_same_as_current');
    }

    await this.usersRepository.updatePassword(user.uniqueId, newPassword);
    this.logger.log(`Password changed: ${user.email}`);
  }

  getSessions(userId: number) {
    return this.sessionsRepository.findAllActiveForUser(userId);
  }

  async revokeSession(userId: number, sessionUniqueId: string): Promise<void> {
    const session = await this.sessionsRepository.findActiveByUniqueIdAndUser(
      sessionUniqueId,
      userId,
    );
    if (!session) throw new BadRequestException('errors.session_not_found');
    await this.sessionsRepository.revoke(session.uniqueId);
  }

  private sanitize(user: UserWithRole): SafeUser {
    const safeUser: Partial<UserWithRole> = { ...user };
    delete safeUser.password;
    delete safeUser.verificationToken;
    delete safeUser.passwordResetToken;
    return safeUser as SafeUser;
  }
}
