import { listBlueprints, type BlueprintSort } from '#lib/api.js';
import { PER_PAGE } from '#lib/config.js';
import type { PageLoad } from './$types';

const SORTS: BlueprintSort[] = ['new', 'updated', 'downloads', 'views', 'likes', 'favorites'];

export const load: PageLoad = async ({ fetch, url }) => {
  const q = url.searchParams.get('q') ?? '';
  const tags = (url.searchParams.get('tags') ?? '').split(',').filter(Boolean);
  const version = url.searchParams.get('version') ?? '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const raw = url.searchParams.get('sort') ?? 'new';
  const sort = (SORTS.includes(raw as BlueprintSort) ? raw : 'new') as BlueprintSort;

  const list = await listBlueprints(fetch, { q, tags, version, sort, page, per_page: PER_PAGE });

  return { list, filters: { q, tags, version, sort, page } };
};
