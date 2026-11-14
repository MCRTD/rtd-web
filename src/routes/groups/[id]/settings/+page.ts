import { error } from '@sveltejs/kit';
import { getGroup, getGroupInvites, getGroupMembers } from '#lib/api.js';
import { atLeast } from '#lib/groups.js';
import type { PageLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageLoad = async ({ fetch, params, url }) => {
  if (!UUID.test(params.id)) error(404, '找不到這個群組');
  const group = await getGroup(fetch, params.id, true);
  if (!atLeast(group.viewer_role, 'admin')) error(403, '只有群組的管理員可以管理群組');
  const [members, invites] = await Promise.all([
    getGroupMembers(fetch, params.id, 1, 100),
    getGroupInvites(fetch, params.id)
  ]);
  return { group, members, invites, created: url.searchParams.has('created') };
};
