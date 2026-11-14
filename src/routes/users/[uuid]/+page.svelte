<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { LoaderCircle, Pencil } from '@lucide/svelte';
  import { avatarUrl } from '#lib/api.js';
  import { errorMessage, request } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import { formatDate, formatNumber, formatRelative } from '#lib/format.js';
  import { MAX_BIO_LEN, ROLE_LABELS } from '#lib/groups.js';
  import BlueprintCard from '#lib/components/BlueprintCard.svelte';
  import BlueprintGrid from '#lib/components/BlueprintGrid.svelte';
  import CopyButton from '#lib/components/CopyButton.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import GroupAvatar from '#lib/components/GroupAvatar.svelte';
  import Pager from '#lib/components/Pager.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const profile = $derived(data.profile);
  const stats = $derived([
    ['藍圖', profile.stats.blueprints],
    ['總下載', profile.stats.downloads],
    ['獲得的讚', profile.stats.likes],
    ['被收藏', profile.stats.favorites]
  ] as const);

  const tabs = $derived([
    { id: 'uploads', label: '藍圖作品' },
    ...(data.me
      ? [
          { id: 'favorites', label: '收藏' },
          { id: 'likes', label: '點讚' },
          { id: 'views', label: '瀏覽紀錄' },
          { id: 'downloads', label: '下載紀錄' }
        ]
      : [])
  ]);

  const EMPTY: Record<string, string> = {
    favorites: '還沒有收藏任何藍圖',
    likes: '還沒有點讚任何藍圖',
    views: '還沒有瀏覽紀錄',
    downloads: '還沒有下載紀錄'
  };

  const hrefFor = (tab: string, page = 1) => {
    const params = new URLSearchParams();
    if (tab !== 'uploads') params.set('tab', tab);
    if (page > 1) params.set('page', String(page));
    return `?${params}`;
  };

  let editing = $state(false);
  let bio = $state('');
  let saving = $state(false);
  let message = $state<string | null>(null);

  function edit() {
    bio = profile.bio;
    message = null;
    editing = true;
  }

  async function save() {
    saving = true;
    message = null;
    try {
      await request('PATCH', '/users/me', { bio });
      await invalidateAll();
      editing = false;
    } catch (e) {
      message = errorMessage(e);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{profile.username} · {SITE_NAME}</title>
  {#if profile.bio}<meta name="description" content={profile.bio.slice(0, 160)} />{/if}
</svelte:head>

<section class="border-b border-cloud-400 bg-cloud-300">
  <div class="container-page flex flex-col gap-5 py-10 md:flex-row md:items-start">
    <img
      src={avatarUrl(profile.uuid, 128)}
      alt=""
      class="size-24 shrink-0 rounded-lg border-4 border-cloud-50 bg-cloud-200 [image-rendering:pixelated]"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <h1 class="text-3xl font-bold text-cloud-950">{profile.username}</h1>
      <p class="flex items-center gap-1 font-mono text-xs text-cloud-800">
        {profile.uuid}
        <CopyButton value={profile.uuid} label="複製 UUID" />
      </p>
      <p class="text-sm text-cloud-800">{formatDate(profile.created_at)} 加入</p>

      {#if editing}
        <div class="mt-2 flex max-w-xl flex-col gap-2">
          <textarea
            bind:value={bio}
            maxlength={MAX_BIO_LEN}
            rows="3"
            aria-label="自我介紹"
            placeholder="介紹一下自己，例如擅長的紅石類型、常玩的伺服器……"
            class="w-full resize-y rounded-md border border-cloud-400 bg-white px-3 py-2 text-sm leading-relaxed focus:border-cloud-600 focus:outline-none"
          ></textarea>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={save}
              disabled={saving}
              class="flex h-8 items-center gap-1.5 rounded-md bg-cloud-600 px-3 text-sm font-bold text-white hover:bg-cloud-700 disabled:opacity-60"
            >
              {#if saving}<LoaderCircle class="size-3.5 animate-spin" />{/if}儲存
            </button>
            <button
              type="button"
              onclick={() => (editing = false)}
              class="h-8 rounded-md px-3 text-sm text-cloud-800 hover:bg-cloud-200"
            >
              取消
            </button>
            <span class="ml-auto text-xs text-cloud-700">{bio.length} / {MAX_BIO_LEN}</span>
          </div>
          {#if message}<p class="text-sm text-red-700" role="alert">{message}</p>{/if}
        </div>
      {:else if profile.bio}
        <p class="mt-2 max-w-xl leading-relaxed break-words whitespace-pre-line text-cloud-900">
          {profile.bio}
          {#if data.me}
            <button
              type="button"
              onclick={edit}
              class="ml-1 inline-flex align-middle text-cloud-700 hover:text-cloud-950"
              aria-label="編輯自我介紹"
            >
              <Pencil class="size-3.5" />
            </button>
          {/if}
        </p>
      {:else if data.me}
        <button
          type="button"
          onclick={edit}
          class="mt-2 inline-flex w-fit items-center gap-1 text-sm text-cloud-800 hover:text-cloud-950 hover:underline"
        >
          <Pencil class="size-3.5" />加上自我介紹
        </button>
      {/if}

      {#if profile.groups.length}
        <ul class="mt-3 flex flex-wrap gap-2" aria-label="加入的群組">
          {#each profile.groups as group (group.id)}
            <li>
              <a
                href="/groups/{group.id}"
                class="flex items-center gap-2 rounded-full border border-cloud-400 bg-cloud-50 py-1 pr-3 pl-1 text-sm text-cloud-900 hover:border-cloud-600"
              >
                <GroupAvatar
                  url={group.avatar_url}
                  name={group.name}
                  class="size-6 rounded-full text-xs"
                />
                {group.name}
                {#if group.role !== 'member'}<span class="text-xs text-cloud-600"
                    >{ROLE_LABELS[group.role]}</span
                  >{/if}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <dl class="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 md:grid-cols-2">
      {#each stats as [term, value] (term)}
        <div>
          <dt class="text-xs text-cloud-700">{term}</dt>
          <dd class="text-2xl font-bold text-cloud-900">{formatNumber(value)}</dd>
        </div>
      {/each}
    </dl>
  </div>
</section>

<div class="container-page flex flex-col gap-6 py-8">
  {#if tabs.length > 1}
    <nav class="flex w-fit flex-wrap gap-1 rounded-lg bg-cloud-200 p-1" aria-label="分頁">
      {#each tabs as tab (tab.id)}
        <a
          href={hrefFor(tab.id)}
          aria-current={data.tab === tab.id ? 'page' : undefined}
          class="rounded-md px-4 py-1.5 text-sm font-medium text-cloud-700 hover:text-cloud-950 aria-[current=page]:bg-white aria-[current=page]:text-cloud-950 aria-[current=page]:shadow-sm"
        >
          {tab.label}
        </a>
      {/each}
    </nav>
  {/if}

  {#if data.list}
    {#if data.list.items.length}
      <BlueprintGrid items={data.list.items} />
      <Pager
        count={data.list.total}
        perPage={data.list.per_page}
        page={data.list.page}
        href={(p) => hrefFor('uploads', p)}
      />
    {:else if data.me}
      <EmptyState title="你還沒有上傳藍圖">
        <a
          href="/upload"
          class="font-medium text-cloud-800 underline underline-offset-4 hover:text-cloud-950"
          >上傳第一個藍圖</a
        >
      </EmptyState>
    {:else}
      <EmptyState title="{profile.username} 還沒有上傳藍圖" />
    {/if}
  {:else if data.activity}
    {#if data.activity.items.length}
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {#each data.activity.items as entry (entry.blueprint.id)}
          <div class="flex flex-col gap-1.5">
            <BlueprintCard blueprint={entry.blueprint} />
            <p class="px-1 text-xs text-cloud-600">
              {formatRelative(entry.at)}{entry.count && entry.count > 1
                ? ` · 共 ${formatNumber(entry.count)} 次`
                : ''}
            </p>
          </div>
        {/each}
      </div>
      <Pager
        count={data.activity.total}
        perPage={data.activity.per_page}
        page={data.activity.page}
        href={(p) => hrefFor(data.tab, p)}
      />
    {:else}
      <EmptyState title={EMPTY[data.tab]} />
    {/if}
  {/if}
</div>
