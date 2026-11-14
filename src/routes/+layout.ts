import { getGroupKinds, getTags, type GroupKind, type Tag } from '#lib/api.js';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, data }) => {
  const [tags, groupKinds] = await Promise.all([
    getTags(fetch).catch((): Tag[] => []),
    getGroupKinds(fetch).catch((): GroupKind[] => [])
  ]);
  return { ...data, tags, groupKinds };
};
