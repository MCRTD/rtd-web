import { fail, redirect } from '@sveltejs/kit';
import { marked } from 'marked';
import { API_URL } from '#lib/config.js';
import { authorizeUrl, isConfigured, randomToken } from '#lib/server/microsoft.js';
import { OAUTH_COOKIE, safeNext, type OAuthState } from '#lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

async function currentTerms(fetcher: typeof fetch) {
  try {
    const res = await fetcher(`${API_URL}/terms`);
    if (!res.ok) return null;
    const data = (await res.json()) as { version: string; content: string };
    return { version: data.version, html: await marked.parse(data.content, { gfm: true }) };
  } catch {
    return null;
  }
}

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
  const next = safeNext(url.searchParams.get('next'));
  if (locals.user) redirect(303, next);
  return {
    next,
    error: url.searchParams.get('error'),
    configured: isConfigured(),
    terms: await currentTerms(fetch)
  };
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const form = await request.formData();
    const terms = String(form.get('terms') ?? '') || null;
    const agreed = form.get('agree') === 'on';
    const next = safeNext(String(form.get('next') ?? ''));

    if (terms && !agreed) return fail(400, { message: '請先勾選同意服務條款。' });
    if (!isConfigured()) return fail(503, { message: '網站尚未設定 Microsoft 登入。' });

    const oauth: OAuthState = { state: randomToken(), verifier: randomToken(), terms, next };
    cookies.set(OAUTH_COOKIE, JSON.stringify(oauth), {
      path: '/auth',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 600
    });

    const target = await authorizeUrl({
      redirectUri: `${url.origin}/auth/callback`,
      state: oauth.state,
      verifier: oauth.verifier
    });
    redirect(303, target, { external: ['https://login.microsoftonline.com'] });
  }
};
