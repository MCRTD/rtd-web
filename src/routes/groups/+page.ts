import { getUser, listGroups, type GroupSort } from '#lib/api.js';
import { PER_PAGE } from '#lib/config.js';
import type { PageLoad } from './$types';

const SORTS: GroupSort[] = ['new', 'members', 'blueprints'];

export const load: PageLoad = async ({ fetch, url }) => {
  const q = url.searchParams.get('q') ?? '';
  const kind = url.searchParams.get('kind') ?? '';
  const member = url.searchParams.get('member') ?? '';
  const raw = url.searchParams.get('sort') ?? 'new';
  const sort = (SORTS.includes(raw as GroupSort) ? raw : 'new') as GroupSort;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  const [list, memberProfile] = await Promise.all([
    listGroups(fetch, { q, kind, member, sort, page, per_page: PER_PAGE }),
    member ? getUser(fetch, member).catch(() => null) : null
  ]);
  return {
    list,
    filters: { q, kind, member, sort, page },
    memberName: memberProfile?.username ?? null
  };
};
