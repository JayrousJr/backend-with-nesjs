import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '@config';

export interface OAuthProfile {
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

/**
 * Google OAuth 2.0 authorization-code flow, implemented directly with fetch —
 * no passport strategy, so the app boots fine with the feature unconfigured.
 * The flow is standard OAuth: replicate this service (auth URL, token URL,
 * userinfo mapping) to add another provider.
 */
@Injectable()
export class GoogleOauthService {
  constructor(private readonly config: AppConfigService) {}

  get enabled(): boolean {
    return this.config.googleOauth.enabled;
  }

  /** Where to send the user's browser to ask Google for consent. */
  buildAuthUrl(state: string): string {
    const { clientId, callbackUrl } = this.requireConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /** Exchange the callback `code` for tokens and fetch the user's profile. */
  async exchangeCode(code: string): Promise<OAuthProfile> {
    const { clientId, clientSecret, callbackUrl } = this.requireConfig();

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      throw new UnauthorizedException('errors.oauth_failed');
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      throw new UnauthorizedException('errors.oauth_failed');
    }

    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) {
      throw new UnauthorizedException('errors.oauth_failed');
    }
    const profile = (await profileRes.json()) as {
      email?: string;
      email_verified?: boolean;
      given_name?: string;
      family_name?: string;
      name?: string;
    };
    if (!profile.email) {
      throw new UnauthorizedException('errors.oauth_failed');
    }

    return {
      email: profile.email,
      emailVerified: profile.email_verified ?? false,
      firstName: profile.given_name ?? profile.name ?? '',
      lastName: profile.family_name ?? '',
    };
  }

  private requireConfig() {
    const { enabled, clientId, clientSecret, callbackUrl } =
      this.config.googleOauth;
    if (!enabled || !clientId || !clientSecret) {
      throw new ServiceUnavailableException('errors.oauth_not_configured');
    }
    return { clientId, clientSecret, callbackUrl };
  }
}
