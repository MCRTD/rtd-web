<script lang="ts">
  import { page } from '$app/state';
  import { Layers, Lock, Users } from '@lucide/svelte';
  import type { Group } from '#lib/api.js';
  import { formatCompact } from '#lib/format.js';
  import GroupAvatar from './GroupAvatar.svelte';

  let { group }: { group: Group } = $props();

  const kindName = $derived(
    (page.data.groupKinds ?? []).find((k) => k.slug === group.kind)?.name ?? group.kind
  );
</script>

<article
  class="group relative flex flex-col overflow-hidden rounded-lg border border-cloud-300 bg-white transition-[border-color,box-shadow] hover:border-cloud-500 hover:shadow-[0_4px_0_0_var(--color-cloud-300)]"
>
  <div class="h-20 bg-cloud-300">
    {#if group.banner_url}<img
        src={group.banner_url}
        alt=""
        loading="lazy"
        class="size-full object-cover"
      />{/if}
  </div>
  <div class="flex flex-1 flex-col gap-2 px-4 pb-4">
    <div class="-mt-7 flex items-end gap-3">
      <GroupAvatar
        url={group.avatar_url}
        name={group.name}
        class="size-14 border-4 border-white text-xl"
      />
      <span class="mb-1 rounded-full bg-cloud-100 px-2 py-0.5 text-xs font-medium text-cloud-800"
        >{kindName}</span
      >
      {#if group.join_policy === 'invite'}
        <Lock class="mb-1.5 size-3.5 text-cloud-500" aria-label="需要邀請" />
      {/if}
    </div>
    <h3 class="line-clamp-1 font-bold text-cloud-950">
      <a href="/groups/{group.id}" class="after:absolute after:inset-0">{group.name}</a>
    </h3>
    {#if group.description.trim()}
      <p class="line-clamp-2 text-sm text-cloud-700">{group.description}</p>
    {/if}
    <div class="mt-auto flex items-center gap-4 pt-1 text-xs text-cloud-600">
      <span class="inline-flex items-center gap-1"
        ><Users class="size-3.5" />{formatCompact(group.member_count)} 位成員</span
      >
      <span class="inline-flex items-center gap-1"
        ><Layers class="size-3.5" />{formatCompact(group.blueprint_count)} 個藍圖</span
      >
    </div>
  </div>
</article>
