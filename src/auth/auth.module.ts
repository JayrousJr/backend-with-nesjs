import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOauthService } from './google-oauth.service';
import { AuthResolver } from './auth.resolver';
import { AccountCleanupService } from './account-cleanup.service';
import { SessionsRepository } from './session.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule,
    UsersModule,
    MailModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthResolver,
    GoogleOauthService,
    SessionsRepository,
    JwtStrategy,
    AccountCleanupService,
  ],
})
export class AuthModule {}
