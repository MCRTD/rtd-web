import { error } from '@sveltejs/kit';
import { getGroup, getGroupMembers, listBlueprints } from '#lib/api.js';
import { PER_PAGE } from '#lib/config.js';
import type { PageLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageLoad = async ({ fetch, params, url, parent }) => {
  if (!UUID.test(params.id)) error(404, '找不到這個群組');
  const { user } = await parent();
  const tab = url.searchParams.get('tab') === 'members' ? 'members' : 'blueprints';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  const [group, blueprints, members] = await Promise.all([
    // 登入時走代理，才拿得到自己的角色與待回覆的邀請。
    getGroup(fetch, params.id, !!user),
    tab === 'blueprints'
      ? listBlueprints(fetch, { group: params.id, page, per_page: PER_PAGE }, !!user)
      : null,
    tab === 'members' ? getGroupMembers(fetch, params.id, page, 60) : null
  ]);
  return { group, tab, blueprints, members };
};
