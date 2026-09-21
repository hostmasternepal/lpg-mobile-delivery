/**
 * Shape attached to `request.user` by JwtStrategy after a valid access
 * token is presented. `permissions` is the fully-resolved set (via the
 * user's roles) at token-issue time — see docs/ARCHITECTURE.md §7.
 */
export interface AuthenticatedUser {
  userId: string;
  phoneOrUsername: string;
  roles: string[];
  permissions: string[];
}
