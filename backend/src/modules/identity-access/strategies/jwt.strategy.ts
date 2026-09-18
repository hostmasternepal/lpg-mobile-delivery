import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

interface JwtPayload {
  sub: string;
  phoneOrUsername: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  // Whatever this returns becomes request.user (consumed by @CurrentUser()
  // and PermissionsGuard). No DB hit here — see IdentityAccessService for
  // the documented staleness tradeoff.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      phoneOrUsername: payload.phoneOrUsername,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
