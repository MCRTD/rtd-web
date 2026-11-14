<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import { Check, FolderPlus, LoaderCircle } from '@lucide/svelte';
  import type { Blueprint, Profile } from '#lib/api.js';
  import { errorMessage, request } from '#lib/client.js';
  import GroupAvatar from './GroupAvatar.svelte';

  // 只有上傳者與共同作者看得到，由外層決定要不要顯示。
  let { blueprint }: { blueprint: Blueprint } = $props();

  let groups = $state<Profile['groups'] | null>(null);
  let added = $state<Set<string>>(new Set());
  let busy = $state<string | null>(null);
  let message = $state<string | null>(null);

  async function load() {
    if (groups) return;
    try {
      groups = (await request<Profile>('GET', '/users/me')).groups;
    } catch (e) {
      message = errorMessage(e);
      groups = [];
    }
  }

  async function add(id: string) {
    busy = id;
    message = null;
    try {
      await request('POST', `/groups/${id}/blueprints`, { blueprint_id: blueprint.id });
      added = new Set([...added, id]);
    } catch (e) {
      message = errorMessage(e);
    } finally {
      busy = null;
    }
  }

  const item =
    'flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm text-cloud-900 outline-none select-none data-highlighted:bg-cloud-100 data-disabled:cursor-default data-disabled:opacity-60';
</script>

<DropdownMenu.Root onOpenChange={(open) => open && load()}>
  <DropdownMenu.Trigger
    class="flex h-10 items-center justify-center gap-2 rounded-lg border border-cloud-300 text-sm font-medium text-cloud-800 transition-colors hover:border-cloud-500 hover:bg-cloud-50"
  >
    <FolderPlus class="size-4" />加入群組
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      sideOffset={6}
      class="z-50 w-64 rounded-md border border-cloud-300 bg-white p-1 shadow-lg"
    >
      {#if !groups}
        <p class="flex items-center gap-2 px-2.5 py-2 text-sm text-cloud-600">
          <LoaderCircle class="size-4 animate-spin" />載入中…
        </p>
      {:else if !groups.length}
        <p class="px-2.5 py-2 text-sm text-cloud-600">你還沒有加入任何群組。</p>
        <DropdownMenu.Item class={item}>
          {#snippet child({ props })}
            <a {...props} href="/groups/new"><FolderPlus class="size-4 text-cloud-600" />建立群組</a
            >
          {/snippet}
        </DropdownMenu.Item>
      {:else}
        {#each groups as group (group.id)}
          <DropdownMenu.Item
            class={item}
            disabled={busy === group.id || added.has(group.id)}
            closeOnSelect={false}
            onSelect={() => add(group.id)}
          >
            <GroupAvatar url={group.avatar_url} name={group.name} class="size-6 text-xs" />
            <span class="min-w-0 flex-1 truncate">{group.name}</span>
            {#if busy === group.id}<LoaderCircle
                class="size-4 animate-spin"
              />{:else if added.has(group.id)}<Check class="size-4 text-emerald-600" />{/if}
          </DropdownMenu.Item>
        {/each}
      {/if}
      {#if message}<p class="px-2.5 py-2 text-xs text-red-700" role="alert">{message}</p>{/if}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
