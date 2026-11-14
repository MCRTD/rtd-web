<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { CheckCheck, Trash2 } from '@lucide/svelte';
  import { errorMessage, request } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import NotificationItem from '#lib/components/NotificationItem.svelte';
  import Pager from '#lib/components/Pager.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let items = $derived(data.list.items);
  let message = $state<string | null>(null);

  async function act(action: () => Promise<unknown>) {
    message = null;
    try {
      await action();
      await invalidateAll();
    } catch (e) {
      message = errorMessage(e);
    }
  }

  const read = (id: string) => act(() => request('POST', `/notifications/${id}/read`));
  const remove = (id: string) => act(() => request('DELETE', `/notifications/${id}`));
  const readAll = () => act(() => request('POST', '/notifications/read-all'));

  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${active ? 'bg-white text-cloud-950 shadow-sm' : 'text-cloud-700 hover:text-cloud-950'}`;
</script>

<svelte:head>
  <title>通知 · {SITE_NAME}</title>
</svelte:head>

<div class="container-page flex max-w-3xl flex-col gap-5 py-8">
  <div class="flex flex-wrap items-center gap-3">
    <h1 class="text-2xl font-bold text-cloud-950">通知</h1>
    <nav class="flex gap-1 rounded-lg bg-cloud-200 p-1">
      <a href="/notifications" class={tab(!data.unread)}>全部</a>
      <a href="/notifications?unread=1" class={tab(data.unread)}
        >未讀{data.list.unread ? `（${data.list.unread}）` : ''}</a
      >
    </nav>
    {#if data.list.unread}
      <button
        type="button"
        onclick={readAll}
        class="ml-auto flex h-9 items-center gap-1.5 rounded-md border border-cloud-300 bg-white px-3 text-sm text-cloud-800 hover:border-cloud-500"
      >
        <CheckCheck class="size-4" />全部標為已讀
      </button>
    {/if}
  </div>

  {#if message}<p class="text-sm text-red-700" role="alert">{message}</p>{/if}

  {#if items.length}
    <ul class="divide-y divide-cloud-100 rounded-lg border border-cloud-300 bg-white">
      {#each items as _, i (items[i].id)}
        <li class="group flex items-start">
          <div class="min-w-0 flex-1">
            <NotificationItem bind:notification={items[i]} onchange={invalidateAll} />
          </div>
          <div
            class="flex gap-1 p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
          >
            {#if !items[i].read_at}
              <button
                type="button"
                onclick={() => read(items[i].id)}
                class="rounded p-1.5 text-cloud-600 hover:bg-cloud-100"
                title="標為已讀"
                aria-label="標為已讀"
              >
                <CheckCheck class="size-4" />
              </button>
            {/if}
            <button
              type="button"
              onclick={() => remove(items[i].id)}
              class="rounded p-1.5 text-cloud-600 hover:bg-cloud-100"
              title="刪除"
              aria-label="刪除"
            >
              <Trash2 class="size-4" />
            </button>
          </div>
        </li>
      {/each}
    </ul>
    <Pager
      count={data.list.total}
      perPage={data.list.per_page}
      page={data.list.page}
      href={(p) =>
        `?${new URLSearchParams({ ...(data.unread ? { unread: '1' } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`}
    />
  {:else}
    <EmptyState title={data.unread ? '沒有未讀的通知' : '目前沒有通知'}>
      群組邀請與邀請的回覆會出現在這裡。
    </EmptyState>
  {/if}
  <p class="text-xs text-cloud-600">已讀超過 90 天的通知會自動清除。</p>
</div>
