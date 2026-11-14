import { json } from '@sveltejs/kit';
import { API_URL } from '#lib/config.js';
import { clearSession } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

// JWT 存在 httpOnly cookie，瀏覽器拿不到，需要登入狀態的 API 都從這裡轉送並補上 Authorization。
const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ALLOWED = new RegExp(
  '^(' +
    [
      'users(/me(/(likes|favorites|views|downloads|invites))?)?',
      `blueprints(/${ID}(/(images(/${ID})?|authors/${ID}|cover|rerender|view|like|favorite))?)?`,
      `groups(/${ID}(/(join|avatar|banner|members(/${ID})?|invites(/${ID})?|blueprints(/${ID})?))?)?`,
      `invites/${ID}/(accept|decline)`,
      `notifications(/(unread-count|read-all|${ID}(/read)?))?`
    ].join('|') +
    ')$',
  'i'
);

const proxy: RequestHandler = async ({ request, params, locals, cookies, url }) => {
  if (!ALLOWED.test(params.path)) {
    return json({ error: 'not_found', message: 'not found' }, { status: 404 });
  }
  if (request.method !== 'GET' && request.headers.get('origin') !== url.origin) {
    return json({ error: 'forbidden', message: 'cross-origin request' }, { status: 403 });
  }
  // 沒登入也轉送（例如公開頁面的資料、計算瀏覽），需要登入的端點由 rtd-server 回 401。
  const headers = new Headers({ accept: 'application/json' });
  if (locals.token) headers.set('authorization', `Bearer ${locals.token}`);
  const type = request.headers.get('content-type');
  if (type) headers.set('content-type', type);
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && request.body;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/${params.path}${url.search}`, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      duplex: 'half'
    } as RequestInit);
  } catch {
    return json({ error: 'unavailable', message: 'cannot reach server' }, { status: 503 });
  }

  if (res.status === 401) clearSession(cookies);

  const out = new Headers({ 'cache-control': 'no-store' });
  const resType = res.headers.get('content-type');
  if (resType) out.set('content-type', resType);
  return new Response(res.status === 204 ? null : res.body, { status: res.status, headers: out });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
