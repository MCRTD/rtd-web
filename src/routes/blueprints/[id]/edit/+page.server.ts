import { error } from '@sveltejs/kit';
import { getBlueprint } from '#lib/api.js';
import { requireUser } from '#lib/server/guard.js';
import type { PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ locals, url, params, fetch }) => {
  const user = requireUser(locals, url);
  if (!UUID.test(params.id)) error(404, '找不到這個藍圖');
  const blueprint = await getBlueprint(fetch, params.id);
  if (blueprint.owner.uuid !== user.uuid) error(403, '只有上傳者可以編輯這個藍圖');
  return { blueprint, notice: url.searchParams.get('notice') };
};
