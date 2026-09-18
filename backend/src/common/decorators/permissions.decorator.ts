import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares the permission codes required to call an endpoint, e.g.
 * `@Permissions('request:verify')`. Enforced by PermissionsGuard, which is
 * deny-by-default: an endpoint with no @Permissions() and no @Public() is
 * rejected, not silently allowed (docs/ARCHITECTURE.md §15, Elevation of
 * Privilege mitigation).
 */
export const Permissions = (...codes: string[]) => SetMetadata(PERMISSIONS_KEY, codes);
