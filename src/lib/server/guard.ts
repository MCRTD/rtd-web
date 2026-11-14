import { redirect } from '@sveltejs/kit';

export function requireUser(locals: App.Locals, url: URL) {
  if (!locals.user) redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  return locals.user;
}
