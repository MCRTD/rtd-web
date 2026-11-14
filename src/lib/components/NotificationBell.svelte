<script lang="ts">
  import { onMount } from 'svelte';
  import { Popover } from 'bits-ui';
  import { Bell, CheckCheck, LoaderCircle } from '@lucide/svelte';
  import type { NotificationList } from '#lib/api.js';
  import { request } from '#lib/client.js';
  import NotificationItem from './NotificationItem.svelte';

  /** 沒有即時推送，每分鐘問一次未讀數量；分頁在背景時不問。 */
  const POLL_MS = 60_000;

  let unread = $state(0);
  let open = $state(false);
  let list = $state<NotificationList | null>(null);
  let loading = $state(false);

  async function refreshCount() {
    if (document.hidden) return;
    try {
      unread = (await request<{ unread: number }>('GET', '/notifications/unread-count')).unread;
    } catch {}
  }

  async function load() {
    loading = true;
    try {
      list = await request<NotificationList>('GET', '/notifications?per_page=8');
      unread = list.unread;
    } catch {
    } finally {
      loading = false;
    }
  }

  async function readAll() {
    try {
      await request('POST', '/notifications/read-all');
      unread = 0;
      if (list) for (const n of list.items) n.read_at ??= new Date().toISOString();
    } catch {}
  }

  onMount(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    document.addEventListener('visibilitychange', refreshCount);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshCount);
    };
  });
</script>

<Popover.Root bind:open onOpenChange={(o) => o && load()}>
  <Popover.Trigger
    class="relative grid size-9 shrink-0 place-items-center rounded-md text-cloud-50 transition-colors hover:bg-cloud-700 data-[state=open]:bg-cloud-700"
    aria-label={unread ? `通知（${unread} 則未讀）` : '通知'}
  >
    <Bell class="size-5" />
    {#if unread}
      <span
        class="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] leading-none font-bold text-white"
      >
        {unread > 99 ? '99+' : unread}
      </span>
    {/if}
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      align="end"
      sideOffset={6}
      class="z-50 flex max-h-[min(32rem,80dvh)] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-md border border-cloud-300 bg-white shadow-lg"
    >
      <div class="flex items-center justify-between border-b border-cloud-200 px-3 py-2">
        <p class="text-sm font-bold text-cloud-950">通知</p>
        {#if unread}
          <button
            type="button"
            onclick={readAll}
            class="flex items-center gap-1 text-xs text-cloud-700 hover:text-cloud-950"
          >
            <CheckCheck class="size-3.5" />全部已讀
          </button>
        {/if}
      </div>
      <div class="min-h-0 flex-1 divide-y divide-cloud-100 overflow-y-auto">
        {#if loading && !list}
          <p class="flex items-center justify-center gap-2 py-8 text-sm text-cloud-600">
            <LoaderCircle class="size-4 animate-spin" />載入中…
          </p>
        {:else if list?.items.length}
          {#each list.items as _, i (list.items[i].id)}
            <NotificationItem bind:notification={list.items[i]} compact onchange={refreshCount} />
          {/each}
        {:else}
          <p class="py-8 text-center text-sm text-cloud-600">目前沒有通知</p>
        {/if}
      </div>
      <a
        href="/notifications"
        onclick={() => (open = false)}
        class="border-t border-cloud-200 py-2 text-center text-sm font-medium text-cloud-800 hover:bg-cloud-50"
      >
        查看全部
      </a>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
