<script lang="ts">
  import { page } from '$app/state';
  import { Check } from '@lucide/svelte';
  import { MAX_TAGS } from '#lib/client.js';

  let { value = $bindable([]) }: { value: string[] } = $props();

  const tags = $derived(page.data.tags ?? []);
  const full = $derived(value.length >= MAX_TAGS);

  function toggle(slug: string) {
    value = value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug];
  }
</script>

<div class="flex flex-col gap-2">
  {#if tags.length}
    <div class="flex flex-wrap gap-1.5" role="group" aria-label="標籤">
      {#each tags as tag (tag.slug)}
        {@const on = value.includes(tag.slug)}
        <button
          type="button"
          aria-pressed={on}
          disabled={!on && full}
          onclick={() => toggle(tag.slug)}
          class="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 {on
            ? 'border-cloud-600 bg-cloud-600 text-white'
            : 'border-cloud-300 bg-white text-cloud-800 hover:border-cloud-500'}"
        >
          {#if on}<Check class="size-3.5" strokeWidth={3} />{/if}
          {tag.name}
        </button>
      {/each}
    </div>
  {:else}
    <p class="text-sm text-cloud-600">目前無法載入標籤清單。</p>
  {/if}
  <p class="text-xs text-cloud-600">已選 {value.length} / {MAX_TAGS}</p>
</div>
