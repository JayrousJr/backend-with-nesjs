import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '@config';
import { CurrentUser } from '@common';
import { UsersRepository } from '../../users/user.repository';
import { JwtPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: AppConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccess.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUser> {
    const user = await this.usersRepository.findByUniqueId(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      uniqueId: user.uniqueId,
      email: user.email,
      role: user.role.name,
      preferredLocale: user.preferredLocale,
      tenantId: user.tenantId ?? undefined,
    };
  }
}
