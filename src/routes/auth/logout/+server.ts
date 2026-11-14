import { redirect } from '@sveltejs/kit';
import { clearSession, safeNext } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request }) => {
  clearSession(cookies);
  // 從前端 fetch 呼叫時沒有表單，回 204 讓前端自己重新整理。
  if (!request.headers.get('content-type')?.includes('form')) {
    return new Response(null, { status: 204 });
  }
  const form = await request.formData().catch(() => null);
  redirect(303, safeNext(form?.get('next')?.toString()));
};
