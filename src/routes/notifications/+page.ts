import { getNotifications } from '#lib/api.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const unread = url.searchParams.get('unread') === '1';
  return { list: await getNotifications(fetch, page, unread), unread };
};
