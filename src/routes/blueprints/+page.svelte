<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { SlidersHorizontal, X } from '@lucide/svelte';
  import { SITE_NAME } from '#lib/config.js';
  import { formatNumber } from '#lib/format.js';
  import BlueprintGrid from '#lib/components/BlueprintGrid.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import FilterPanel from '#lib/components/FilterPanel.svelte';
  import Pager from '#lib/components/Pager.svelte';
  import type { BlueprintSort } from '#lib/api.js';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const filters = $derived(data.filters);

  const SORT_LABELS: Record<BlueprintSort, string> = {
    new: '最新上傳',
    updated: '最近更新',
    downloads: '最多下載',
    likes: '最多讚',
    favorites: '最多收藏',
    views: '最多瀏覽'
  };

  function urlWith(changes: {
    q?: string;
    tags?: string[];
    version?: string;
    sort?: BlueprintSort;
    page?: number;
  }) {
    const next = { ...filters, page: 1, ...changes };
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.tags.length) params.set('tags', next.tags.join(','));
    if (next.version) params.set('version', next.version);
    if (next.sort !== 'new') params.set('sort', next.sort);
    if (next.page > 1) params.set('page', String(next.page));
    return `/blueprints${params.size ? `?${params}` : ''}`;
  }

  const navigate = (changes: Parameters<typeof urlWith>[0]) =>
    goto(urlWith(changes), { reset: false });

  let showFilters = $state(false);
  const activeCount = $derived(filters.tags.length + (filters.version ? 1 : 0));

  const tagName = (slug: string) =>
    (page.data.tags ?? []).find((t) => t.slug === slug)?.name ?? slug;
</script>

<svelte:head>
  <title>{filters.q ? `「${filters.q}」的搜尋結果` : '瀏覽藍圖'} · {SITE_NAME}</title>
</svelte:head>

<div class="container-page py-8">
  <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-cloud-950">
        {filters.q ? `「${filters.q}」` : '所有藍圖'}
      </h1>
      <p class="mt-1 text-sm text-cloud-700">共 {formatNumber(data.list.total)} 個藍圖</p>
    </div>

    <label class="flex items-center gap-2 text-sm text-cloud-700 sm:order-last">
      排序
      <select
        value={filters.sort}
        onchange={(e) => navigate({ sort: e.currentTarget.value as BlueprintSort })}
        class="h-9 rounded-md border border-cloud-300 bg-white px-2 text-sm text-cloud-900 focus:border-cloud-600 focus:outline-none"
      >
        {#each Object.entries(SORT_LABELS) as [value, label] (value)}
          <option {value}>{label}</option>
        {/each}
      </select>
    </label>

    {#if filters.q || filters.tags.length || filters.version}
      <div class="flex flex-wrap gap-2">
        {#if filters.q}
          <a
            href={urlWith({ q: '' })}
            class="inline-flex items-center gap-1 rounded-full bg-cloud-600 px-3 py-1 text-xs text-white hover:bg-cloud-700"
          >
            {filters.q}<X class="size-3" />
          </a>
        {/if}
        {#if filters.version}
          <a
            href={urlWith({ version: '' })}
            class="inline-flex items-center gap-1 rounded-full bg-cloud-600 px-3 py-1 text-xs text-white hover:bg-cloud-700"
          >
            {filters.version}<X class="size-3" />
          </a>
        {/if}
        {#each filters.tags as slug (slug)}
          <a
            href={urlWith({ tags: filters.tags.filter((t) => t !== slug) })}
            class="inline-flex items-center gap-1 rounded-full bg-cloud-600 px-3 py-1 text-xs text-white hover:bg-cloud-700"
          >
            {tagName(slug)}<X class="size-3" />
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <div class="grid gap-6 lg:grid-cols-[15rem_1fr]">
    <aside class="lg:sticky lg:top-24 lg:self-start">
      <button
        type="button"
        onclick={() => (showFilters = !showFilters)}
        aria-expanded={showFilters}
        class="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-cloud-300 bg-white text-sm font-medium text-cloud-800 lg:hidden"
      >
        <SlidersHorizontal class="size-4" />
        篩選{activeCount ? `（${activeCount}）` : ''}
      </button>
      <div class="mt-2 lg:mt-0 lg:block {showFilters ? 'block' : 'hidden'}">
        <FilterPanel
          tags={page.data.tags ?? []}
          selected={filters.tags}
          version={filters.version}
          onTags={(tags) => navigate({ tags })}
          onVersion={(version) => navigate({ version })}
          onReset={() => navigate({ tags: [], version: '' })}
        />
      </div>
    </aside>

    <section class="flex flex-col gap-8">
      {#if data.list.items.length}
        <BlueprintGrid items={data.list.items} />
        <Pager
          count={data.list.total}
          perPage={data.list.per_page}
          page={data.list.page}
          href={(p) => urlWith({ ...filters, page: p })}
        />
      {:else}
        <EmptyState title="找不到符合條件的藍圖">
          試試其他關鍵字，或<a
            href="/blueprints"
            class="font-medium text-cloud-800 underline underline-offset-4">清除所有篩選</a
          >
        </EmptyState>
      {/if}
    </section>
  </div>
</div>
