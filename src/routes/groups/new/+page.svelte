<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { ChevronRight, LoaderCircle } from '@lucide/svelte';
  import type { Group, GroupLink } from '#lib/api.js';
  import { errorMessage, request } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import GroupFields from '#lib/components/GroupFields.svelte';

  let name = $state('');
  let kind = $state(page.data.groupKinds?.[0]?.slug ?? 'team');
  let joinPolicy = $state<'open' | 'invite'>('invite');
  let description = $state('');
  let links = $state<GroupLink[]>([]);

  let saving = $state(false);
  let message = $state<string | null>(null);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    message = null;
    try {
      const group = await request<Group>('POST', '/groups', {
        name: name.trim(),
        kind,
        join_policy: joinPolicy,
        description,
        links: links.map((l) => ({
          type: l.type,
          url: l.url.trim(),
          ...(l.label?.trim() ? { label: l.label.trim() } : {})
        }))
      });
      // 先到設定頁讓人上傳頭像與邀請成員。
      goto(`/groups/${group.id}/settings?created=1`);
    } catch (err) {
      message = errorMessage(err);
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>建立群組 · {SITE_NAME}</title>
</svelte:head>

<div class="container-page max-w-3xl py-8">
  <nav aria-label="導覽路徑" class="mb-4 flex items-center gap-1 text-sm text-cloud-600">
    <a href="/groups" class="hover:text-cloud-900 hover:underline">群組</a>
    <ChevronRight class="size-3.5" />
    <span class="text-cloud-900">建立群組</span>
  </nav>
  <h1 class="mb-6 text-2xl font-bold text-cloud-950">建立群組</h1>

  <form
    onsubmit={submit}
    class="flex flex-col gap-6 rounded-lg border border-cloud-300 bg-white p-6"
  >
    <GroupFields bind:name bind:kind bind:joinPolicy bind:description bind:links />
    <p class="text-sm text-cloud-700">建立後可以上傳頭像與封面、邀請成員。你會成為群組的擁有者。</p>
    {#if message}<p class="text-sm text-red-700" role="alert">{message}</p>{/if}
    <div class="flex justify-end">
      <button
        type="submit"
        disabled={saving || !name.trim()}
        class="flex h-11 items-center gap-2 rounded-lg bg-cloud-600 px-6 font-bold text-white shadow-[0_3px_0_0_var(--color-cloud-800)] hover:bg-cloud-700 disabled:opacity-60"
      >
        {#if saving}<LoaderCircle class="size-4 animate-spin" />{/if}建立群組
      </button>
    </div>
  </form>
</div>
