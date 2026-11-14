import type { Handle } from '@sveltejs/kit/hooks';
import { TOKEN_COOKIE, readUser } from '#lib/server/session.js';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = readUser(event.cookies);
  event.locals.token = event.locals.user ? (event.cookies.get(TOKEN_COOKIE) ?? null) : null;
  return resolve(event);
};
