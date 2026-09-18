import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../common/prisma/prisma.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { LoginDto } from './dto/login.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_PREFIX = 'refresh_token:';

/**
 * AuthN/AuthZ for all system users. Beneficiaries never authenticate here —
 * they are not system users (SRS REQ-010); the OTP they receive is a
 * one-time delivery-confirmation code handled entirely by the Otp module,
 * not a login credential. See docs/ARCHITECTURE.md §6.
 *
 * Password hashing: argon2id (correct primitive for large-keyspace
 * passwords). This is intentionally different from OTP hashing
 * (HMAC-SHA256, ARCH-DECISION-10) — see docs/ARCHITECTURE_REVIEW.md E-1
 * for why the two must not share an algorithm.
 */
@Injectable()
export class IdentityAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { phoneOrUsername: dto.phoneOrUsername },
    });

    const passwordValid = user ? await argon2.verify(user.passwordHash, dto.password) : false;

    if (!user || !user.isActive || !passwordValid) {
      this.events.emit('identity.login_failed', {
        phoneOrUsername: dto.phoneOrUsername,
        occurredAt: new Date(),
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    const authUser = await this.buildAuthenticatedUser(user.id);
    const tokens = await this.issueTokens(authUser);

    this.events.emit('identity.login_succeeded', {
      actorId: user.id,
      occurredAt: new Date(),
    });

    return tokens;
  }

  async refresh(presentedRefreshToken: string): Promise<TokenPair> {
    const userId = await this.redis.get(`${REFRESH_TOKEN_PREFIX}${presentedRefreshToken}`);
    if (!userId) {
      throw new UnauthorizedException('Refresh token invalid or expired.');
    }

    // Rotate: the presented token is single-use.
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${presentedRefreshToken}`);

    const authUser = await this.buildAuthenticatedUser(userId);
    return this.issueTokens(authUser);
  }

  async logout(presentedRefreshToken: string): Promise<void> {
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${presentedRefreshToken}`);
  }

  /**
   * Resolves a user's permission set via roles -> role_permissions ->
   * permissions. This is the only place that answers "what can this user
   * do" — PermissionsGuard trusts the JWT payload built from this at
   * issue time, not a fresh DB read per request (a deliberate tradeoff:
   * short access-token TTL bounds the staleness window if a role changes
   * mid-session; RoleChangedEvent, once consumed by AuditLog, is where an
   * administrator would see that a forced-logout may be warranted).
   */
  async resolvePermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const roles = userRoles.map((ur) => ur.role.name);
    const permissions = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.code);
      }
    }

    return { roles, permissions: Array.from(permissions) };
  }

  private async buildAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new ForbiddenException('User is inactive or no longer exists.');
    }
    const { roles, permissions } = await this.resolvePermissions(userId);
    return { userId: user.id, phoneOrUsername: user.phoneOrUsername, roles, permissions };
  }

  private async issueTokens(authUser: AuthenticatedUser): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: authUser.userId,
        phoneOrUsername: authUser.phoneOrUsername,
        roles: authUser.roles,
        permissions: authUser.permissions,
      },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl'),
      },
    );

    const refreshToken = randomUUID();
    const refreshTtlSeconds = this.parseTtlToSeconds(this.config.get<string>('jwt.refreshTtl')!);
    await this.redis.set(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      authUser.userId,
      'EX',
      refreshTtlSeconds,
    );

    return { accessToken, refreshToken };
  }

  private parseTtlToSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 7 * 24 * 60 * 60;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
    return value * multiplier;
  }
}
