<script lang="ts">
  import { Download, Gamepad2, Heart } from '@lucide/svelte';
  import type { Blueprint } from '#lib/api.js';
  import { formatCompact, formatRelative, formatVersionRange } from '#lib/format.js';
  import Cover from './Cover.svelte';
  import TagChip from './TagChip.svelte';

  let { blueprint }: { blueprint: Blueprint } = $props();
</script>

<article
  class="group relative flex flex-col overflow-hidden rounded-lg border border-cloud-300 bg-white transition-[border-color,box-shadow] hover:border-cloud-500 hover:shadow-[0_4px_0_0_var(--color-cloud-300)]"
>
  <Cover {blueprint} class="aspect-video" />

  <div class="flex flex-1 flex-col gap-2 p-4">
    <h3 class="line-clamp-1 font-bold text-cloud-950">
      <a href="/blueprints/{blueprint.id}" class="after:absolute after:inset-0">{blueprint.name}</a>
    </h3>

    <p class="text-sm text-cloud-700">
      <a href="/users/{blueprint.owner.uuid}" class="relative z-10 font-medium hover:underline"
        >{blueprint.owner.username}</a
      >{#if blueprint.authors.length}<span
          title={blueprint.authors.map((a) => a.username).join('、')}
          class="relative z-10 cursor-default"
        >
          等 {blueprint.authors.length + 1} 人</span
        >{/if}
      <span class="text-cloud-500">· {formatRelative(blueprint.created_at)}</span>
    </p>

    {#if blueprint.tags.length}
      <div class="relative z-10 flex flex-wrap gap-1">
        {#each blueprint.tags as slug (slug)}
          <TagChip {slug} />
        {/each}
      </div>
    {/if}

    <div class="mt-auto flex items-center justify-between pt-2 text-xs text-cloud-600">
      <span class="inline-flex items-center gap-1">
        <Gamepad2 class="size-3.5" />
        {formatVersionRange(blueprint.mc_versions.min, blueprint.mc_versions.max)}
      </span>
      <span class="inline-flex items-center gap-3">
        {#if blueprint.like_count}
          <span class="inline-flex items-center gap-1" title="讚">
            <Heart class="size-3.5" />{formatCompact(blueprint.like_count)}
          </span>
        {/if}
        <span class="inline-flex items-center gap-1" title="下載">
          <Download class="size-3.5" />{formatCompact(blueprint.download_count)}
        </span>
      </span>
    </div>
  </div>
</article>
