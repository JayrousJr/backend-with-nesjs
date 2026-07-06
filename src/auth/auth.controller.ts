import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { AppConfigService } from '@config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, Public } from '@common';
import type { CurrentUser as CurrentUserData } from '@common';
import { AuthService } from './auth.service';
import type { SessionMetadata } from './auth.service';
import { GoogleOauthService } from './google-oauth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

function sessionMetadata(req: Request): SessionMetadata {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOauth: GoogleOauthService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Google OAuth — start. Sets a short-lived state cookie (CSRF) and sends
   * the browser to Google's consent screen. 404s when the feature is
   * unconfigured so it's invisible unless GOOGLE_CLIENT_ID/SECRET are set.
   */
  @Public()
  @Get('google')
  googleStart(@Res() res: Response) {
    if (!this.googleOauth.enabled) throw new NotFoundException();
    const state = randomBytes(16).toString('hex');
    res.cookie('oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 10 * 60_000,
    });
    res.redirect(this.googleOauth.buildAuthUrl(state));
  }

  /**
   * Google OAuth — callback. Exchanges the code, signs the user in (creating
   * the account on first login), then hands tokens to the SPA in the URL
   * fragment — fragments never reach server logs or Referer headers.
   */
  @Public()
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    if (!this.googleOauth.enabled) throw new NotFoundException();
    const callbackUrl = `${this.config.frontendUrl}/auth/callback`;

    const cookieState = (req.cookies as Record<string, string> | undefined)
      ?.oauth_state;
    res.clearCookie('oauth_state');

    if (error || !code || !state || state !== cookieState) {
      return res.redirect(`${callbackUrl}#error=oauth_failed`);
    }

    try {
      const profile = await this.googleOauth.exchangeCode(code);
      const tokens = await this.authService.oauthLogin(
        profile,
        sessionMetadata(req),
      );
      const fragment = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      return res.redirect(`${callbackUrl}#${fragment.toString()}`);
    } catch {
      return res.redirect(`${callbackUrl}#error=oauth_failed`);
    }
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  changePassword(
    @AuthUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.uniqueId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Get('sessions')
  @ApiBearerAuth()
  getSessions(@AuthUser() user: CurrentUserData) {
    return this.authService.getSessions(user.id);
  }

  @Delete('sessions/:uniqueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  revokeSession(
    @AuthUser() user: CurrentUserData,
    @Param('uniqueId') uniqueId: string,
  ) {
    return this.authService.revokeSession(user.id, uniqueId);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, sessionMetadata(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refreshToken(
      dto.refreshToken,
      sessionMetadata(req),
    );
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  logoutAll(@AuthUser() user: CurrentUserData) {
    return this.authService.logoutAll(user.id);
  }
}
