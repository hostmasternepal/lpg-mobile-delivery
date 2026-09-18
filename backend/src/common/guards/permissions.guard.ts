import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Deny-by-default authorization: an endpoint with neither @Public() nor
 * @Permissions(...) is rejected outright, closing the gap where a future
 * endpoint could be added without anyone deciding its access level
 * (docs/ARCHITECTURE_REVIEW.md K / Elevation of Privilege).
 */
@Injectable()
export class PermissionsGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      throw new ForbiddenException(
        'Endpoint has no declared @Permissions() or @Public() — access denied by default.',
      );
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) {
      throw new ForbiddenException('No authenticated user on request.');
    }

    const hasAll = required.every((code) => user.permissions.includes(code));
    if (!hasAll) {
      throw new ForbiddenException(`Missing required permission(s): ${required.join(', ')}`);
    }

    return true;
  }
}
