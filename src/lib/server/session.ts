import type { Cookies } from '@sveltejs/kit';
import { API_URL } from '#lib/config.js';
import type { User } from '#lib/api.js';
import { LoginError } from './microsoft.js';

const JOIN_URL = 'https://sessionserver.mojang.com/session/minecraft/join';

export const TOKEN_COOKIE = 'rtd_token';
export const USER_COOKIE = 'rtd_user';
export const OAUTH_COOKIE = 'rtd_oauth';

export type OAuthState = {
  state: string;
  verifier: string;
  terms: string | null;
  next: string;
};

export class TermsRequiredError extends LoginError {}

export function safeNext(value: string | null | undefined) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

async function rtd(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', accept: 'application/json', ...init.headers }
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

export async function loginToRtd(
  session: { accessToken: string; uuid: string; username: string },
  terms: string | null
) {
  const challenge = await rtd('/auth/challenge', { method: 'POST' });
  if (!challenge.res.ok || !challenge.data?.server_id) {
    console.error('rtd challenge failed', challenge.res.status, challenge.data);
    throw new LoginError('無法連線到 MC RTD 伺服器。');
  }

  const join = await fetch(JOIN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessToken: session.accessToken,
      selectedProfile: session.uuid,
      serverId: challenge.data.server_id
    })
  });
  if (!join.ok) {
    console.error('Mojang session join failed', join.status, await join.text().catch(() => ''));
    throw new LoginError('Mojang 驗證失敗，請再試一次。');
  }

  const login = await rtd('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: session.username,
      server_id: challenge.data.server_id,
      ...(terms ? { terms_version: terms } : {})
    })
  });
  if (login.res.status === 403 && login.data?.error === 'terms_required') {
    throw new TermsRequiredError('服務條款已更新，請重新閱讀並同意。');
  }
  if (!login.res.ok || !login.data?.token) {
    console.error('rtd login failed', login.res.status, login.data);
    throw new LoginError(login.data?.message ?? 'MC RTD 登入失敗。');
  }
  return login.data as { token: string; expires_at: string; user: User };
}

export function setSession(
  cookies: Cookies,
  session: { token: string; expires_at: string; user: User }
) {
  const options = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    expires: new Date(session.expires_at)
  };
  cookies.set(TOKEN_COOKIE, session.token, options);
  cookies.set(USER_COOKIE, JSON.stringify(session.user), options);
}

export function clearSession(cookies: Cookies) {
  cookies.delete(TOKEN_COOKIE, { path: '/' });
  cookies.delete(USER_COOKIE, { path: '/' });
}

export function readUser(cookies: Cookies): User | null {
  if (!cookies.get(TOKEN_COOKIE)) return null;
  try {
    const user = JSON.parse(cookies.get(USER_COOKIE) ?? '');
    return user?.uuid && user?.username ? user : null;
  } catch {
    return null;
  }
}
