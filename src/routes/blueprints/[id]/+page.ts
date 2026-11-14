import { error } from '@sveltejs/kit';
import { getBlueprint } from '#lib/api.js';
import type { PageLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageLoad = async ({ fetch, params, parent }) => {
  if (!UUID.test(params.id)) error(404, '找不到這個藍圖');
  const { user } = await parent();
  // 登入時走代理，才拿得到自己有沒有點讚／收藏。
  const blueprint = await getBlueprint(fetch, params.id, !!user);
  return { blueprint };
};
