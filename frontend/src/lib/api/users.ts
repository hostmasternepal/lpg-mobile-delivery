import { apiFetch } from '../api-client';
import { AppUser, Role } from './types';

export function listUsers(accessToken: string) {
  return apiFetch<AppUser[]>('/users', { accessToken });
}

export function createUser(
  accessToken: string,
  input: { fullName: string; phoneOrUsername: string; password: string; roleNames: string[] },
) {
  return apiFetch<AppUser>('/users', { method: 'POST', body: JSON.stringify(input), accessToken });
}

export function listRoles(accessToken: string) {
  return apiFetch<Role[]>('/roles', { accessToken });
}
