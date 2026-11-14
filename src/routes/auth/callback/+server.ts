import { redirect } from '@sveltejs/kit';
import { LoginError, minecraftSession } from '#lib/server/microsoft.js';
import { OAUTH_COOKIE, loginToRtd, setSession, type OAuthState } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

function back(message: string, next = '/') {
  const params = new URLSearchParams({ error: message });
  if (next !== '/') params.set('next', next);
  return `/login?${params}`;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
  let oauth: OAuthState | null = null;
  try {
    oauth = JSON.parse(cookies.get(OAUTH_COOKIE) ?? '');
  } catch {}
  cookies.delete(OAUTH_COOKIE, { path: '/auth' });

  if (!oauth || url.searchParams.get('state') !== oauth.state) {
    redirect(303, back('登入逾時或驗證資料不符，請重新登入。'));
  }

  const msError = url.searchParams.get('error');
  if (msError) {
    redirect(
      303,
      back(msError === 'access_denied' ? '已取消登入。' : 'Microsoft 登入失敗。', oauth.next)
    );
  }

  const code = url.searchParams.get('code');
  if (!code) redirect(303, back('Microsoft 沒有回傳授權碼。', oauth.next));

  let target: string;
  try {
    const session = await minecraftSession(code, `${url.origin}/auth/callback`, oauth.verifier);
    const result = await loginToRtd(session, oauth.terms);
    setSession(cookies, result);
    target = oauth.next;
  } catch (e) {
    if (!(e instanceof LoginError)) console.error('login failed', e);
    target = back(e instanceof LoginError ? e.message : '登入時發生錯誤，請再試一次。', oauth.next);
  }
  redirect(303, target);
};
