<script lang="ts">
  import { goto } from '$app/navigation';
  import { Check, LoaderCircle, X } from '@lucide/svelte';
  import type { Notification } from '#lib/api.js';
  import { errorMessage, request } from '#lib/client.js';
  import { formatRelative } from '#lib/format.js';
  import { ROLE_LABELS } from '#lib/groups.js';

  let {
    notification = $bindable(),
    compact = false,
    onchange
  }: { notification: Notification; compact?: boolean; onchange?: () => void } = $props();

  let busy = $state<'accept' | 'decline' | null>(null);
  let message = $state<string | null>(null);

  const STATUS: Record<string, string> = {
    accepted: '已接受',
    declined: '已拒絕',
    cancelled: '邀請已取消'
  };

  async function respond(accept: boolean) {
    if (notification.kind !== 'group_invite') return;
    busy = accept ? 'accept' : 'decline';
    message = null;
    const { invite_id, group } = notification.data;
    try {
      await request('POST', `/invites/${invite_id}/${accept ? 'accept' : 'decline'}`);
      notification.data.status = accept ? 'accepted' : 'declined';
      notification.read_at ??= new Date().toISOString();
      onchange?.();
      if (accept) goto(`/groups/${group.id}`);
    } catch (e) {
      message = errorMessage(e);
    } finally {
      busy = null;
    }
  }

  const unread = $derived(!notification.read_at);
</script>

<div class="flex gap-3 {compact ? 'px-3 py-2.5' : 'p-4'}">
  <span
    class="mt-1.5 size-2 shrink-0 rounded-full {unread ? 'bg-cloud-600' : 'bg-transparent'}"
    aria-hidden="true"
  ></span>
  <div class="flex min-w-0 flex-1 flex-col gap-1.5">
    {#if notification.kind === 'group_invite'}
      {@const d = notification.data}
      <p class="text-sm text-cloud-900">
        <a href="/users/{d.invited_by.uuid}" class="font-bold hover:underline"
          >{d.invited_by.username}</a
        >
        邀請你以{ROLE_LABELS[d.role]}身分加入
        <a href="/groups/{d.group.id}" class="font-bold hover:underline">{d.group.name}</a>
      </p>
      {#if d.status === 'pending'}
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => respond(true)}
            disabled={!!busy}
            class="flex h-8 items-center gap-1.5 rounded-md bg-cloud-600 px-3 text-xs font-bold text-white hover:bg-cloud-700 disabled:opacity-60"
          >
            {#if busy === 'accept'}<LoaderCircle class="size-3.5 animate-spin" />{:else}<Check
                class="size-3.5"
              />{/if}接受
          </button>
          <button
            type="button"
            onclick={() => respond(false)}
            disabled={!!busy}
            class="flex h-8 items-center gap-1.5 rounded-md border border-cloud-300 px-3 text-xs font-medium text-cloud-800 hover:bg-cloud-50 disabled:opacity-60"
          >
            {#if busy === 'decline'}<LoaderCircle class="size-3.5 animate-spin" />{:else}<X
                class="size-3.5"
              />{/if}拒絕
          </button>
        </div>
      {:else}
        <p class="text-xs font-medium text-cloud-600">{STATUS[d.status] ?? d.status}</p>
      {/if}
    {:else if notification.kind === 'group_invite_accepted' || notification.kind === 'group_invite_declined'}
      {@const d = notification.data}
      <p class="text-sm text-cloud-900">
        <a href="/users/{d.user.uuid}" class="font-bold hover:underline">{d.user.username}</a>
        {notification.kind === 'group_invite_accepted' ? '接受了' : '拒絕了'}加入
        <a href="/groups/{d.group.id}" class="font-bold hover:underline">{d.group.name}</a>
        的邀請
      </p>
    {:else if notification.kind === 'blueprint_author_added'}
      {@const d = notification.data}
      <p class="text-sm text-cloud-900">
        <a href="/users/{d.added_by.uuid}" class="font-bold hover:underline"
          >{d.added_by.username}</a
        >
        把你加入為
        <a href="/blueprints/{d.blueprint.id}" class="font-bold hover:underline"
          >{d.blueprint.name}</a
        >
        的共同作者
      </p>
    {:else}
      <p class="text-sm text-cloud-700">有一則新通知，請更新網站後查看。</p>
    {/if}
    {#if message}<p class="text-xs text-red-700" role="alert">{message}</p>{/if}
    <p class="text-xs text-cloud-500">{formatRelative(notification.created_at)}</p>
  </div>
</div>
