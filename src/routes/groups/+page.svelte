<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Plus, Search, X } from '@lucide/svelte';
  import type { GroupSort } from '#lib/api.js';
  import { SITE_NAME } from '#lib/config.js';
  import { formatNumber } from '#lib/format.js';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import GroupCard from '#lib/components/GroupCard.svelte';
  import Pager from '#lib/components/Pager.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const filters = $derived(data.filters);
  const kinds = $derived(page.data.groupKinds ?? []);
  const mine = $derived(!!data.user && filters.member === data.user.uuid);

  type Filters = typeof filters;
  function urlWith(changes: Partial<Filters>) {
    const next = { ...filters, page: 1, ...changes };
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.kind) params.set('kind', next.kind);
    if (next.member) params.set('member', next.member);
    if (next.sort !== 'new') params.set('sort', next.sort);
    if (next.page > 1) params.set('page', String(next.page));
    return `/groups${params.size ? `?${params}` : ''}`;
  }

  // svelte-ignore state_referenced_locally
  let query = $state(filters.q);
  $effect(() => {
    query = filters.q;
  });

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm transition-colors ${active ? 'bg-cloud-600 text-white' : 'bg-white text-cloud-800 border border-cloud-300 hover:border-cloud-500'}`;
</script>

<svelte:head>
  <title>{mine ? '我的群組' : '群組'} · {SITE_NAME}</title>
</svelte:head>

<div class="container-page flex flex-col gap-6 py-8">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-cloud-950">
        {mine ? '我的群組' : data.memberName ? `${data.memberName} 加入的群組` : '群組'}
      </h1>
      <p class="mt-1 text-sm text-cloud-700">
        團隊、伺服器、合集……共 {formatNumber(data.list.total)} 個群組
      </p>
    </div>
    {#if data.user}
      <a
        href="/groups/new"
        class="flex h-10 items-center gap-1.5 rounded-lg bg-cloud-600 px-4 text-sm font-bold text-white shadow-[0_3px_0_0_var(--color-cloud-800)] hover:bg-cloud-700"
      >
        <Plus class="size-4" />建立群組
      </a>
    {/if}
  </div>

  <div class="flex flex-col gap-3 rounded-lg border border-cloud-300 bg-white p-4">
    <div class="flex flex-wrap gap-3">
      <form
        role="search"
        class="relative min-w-48 flex-1"
        onsubmit={(e) => {
          e.preventDefault();
          goto(urlWith({ q: query.trim() }));
        }}
      >
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cloud-500"
        />
        <input
          type="search"
          bind:value={query}
          placeholder="搜尋群組名稱"
          aria-label="搜尋群組名稱"
          class="h-9 w-full rounded-md border border-cloud-300 pr-3 pl-9 text-sm focus:border-cloud-600 focus:outline-none"
        />
      </form>
      <label class="flex items-center gap-2 text-sm text-cloud-700">
        排序
        <select
          value={filters.sort}
          onchange={(e) => goto(urlWith({ sort: e.currentTarget.value as GroupSort }))}
          class="h-9 rounded-md border border-cloud-300 bg-white px-2 text-sm text-cloud-900 focus:border-cloud-600 focus:outline-none"
        >
          <option value="new">最新建立</option>
          <option value="members">最多成員</option>
          <option value="blueprints">最多藍圖</option>
        </select>
      </label>
    </div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="群組類型">
      <a href={urlWith({ kind: '' })} class={chip(!filters.kind)}>全部</a>
      {#each kinds as kind (kind.slug)}
        <a href={urlWith({ kind: kind.slug })} class={chip(filters.kind === kind.slug)}
          >{kind.name}</a
        >
      {/each}
      {#if filters.member}
        <a
          href={urlWith({ member: '' })}
          class="inline-flex items-center gap-1 rounded-full bg-cloud-600 px-3 py-1 text-sm text-white hover:bg-cloud-700"
        >
          {mine ? '我加入的' : (data.memberName ?? '成員')}<X class="size-3" />
        </a>
      {/if}
    </div>
  </div>

  {#if data.list.items.length}
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each data.list.items as group (group.id)}
        <GroupCard {group} />
      {/each}
    </div>
    <Pager
      count={data.list.total}
      perPage={data.list.per_page}
      page={data.list.page}
      href={(p) => urlWith({ page: p })}
    />
  {:else}
    <EmptyState title={mine ? '你還沒有加入任何群組' : '找不到符合條件的群組'}>
      {#if data.user}
        <a href="/groups/new" class="font-medium text-cloud-800 underline underline-offset-4"
          >建立一個群組</a
        >
      {/if}
    </EmptyState>
  {/if}
</div>
