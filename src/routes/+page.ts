import { listBlueprints, type BlueprintList } from '#lib/api.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const [latest, popular] = await Promise.all([
    listBlueprints(fetch, { per_page: 8 }),
    listBlueprints(fetch, { sort: 'likes', per_page: 4 }).catch((): BlueprintList | null => null)
  ]);
  return { latest, popular: popular?.items.some((bp) => bp.like_count > 0) ? popular : null };
};
