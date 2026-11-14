import { error } from '@sveltejs/kit';
import { getMyActivity, getUser, listBlueprints, type ActivityKind } from '#lib/api.js';
import { PER_PAGE } from '#lib/config.js';
import type { PageLoad } from './$types';

const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const PRIVATE: ActivityKind[] = ['favorites', 'likes', 'views', 'downloads'];

const plain = (uuid: string) => uuid.replaceAll('-', '').toLowerCase();

export const load: PageLoad = async ({ fetch, params, url, parent }) => {
  if (!UUID.test(params.uuid)) error(404, '找不到這位玩家');
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const { user } = await parent();
  const me = !!user && plain(user.uuid) === plain(params.uuid);

  const raw = url.searchParams.get('tab') as ActivityKind | null;
  const tab: ActivityKind | 'uploads' = raw && PRIVATE.includes(raw) && me ? raw : 'uploads';

  const [profile, list, activity] = await Promise.all([
    getUser(fetch, params.uuid),
    tab === 'uploads'
      ? listBlueprints(fetch, { author: params.uuid, page, per_page: PER_PAGE }, !!user)
      : null,
    tab !== 'uploads' ? getMyActivity(fetch, tab, page, PER_PAGE) : null
  ]);
  return { profile, me, tab, list, activity };
};
