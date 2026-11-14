<script lang="ts">
  import { ImageOff, LoaderCircle } from '@lucide/svelte';
  import type { Blueprint } from '#lib/api.js';

  let { blueprint, class: className = '' }: { blueprint: Blueprint; class?: string } = $props();

  let failed = $state(false);
  const busy = $derived(
    blueprint.render.status === 'pending' || blueprint.render.status === 'rendering'
  );
</script>

<div class="relative overflow-hidden bg-cloud-300 {className}">
  {#if blueprint.cover.url && !failed}
    <img
      src={blueprint.cover.url}
      alt={blueprint.name}
      loading="lazy"
      decoding="async"
      onerror={() => (failed = true)}
      class="size-full object-cover"
    />
  {:else}
    <div class="flex size-full flex-col items-center justify-center gap-2 text-cloud-700">
      {#if busy}
        <LoaderCircle class="size-6 animate-spin" />
        <span class="text-xs">封面產生中</span>
      {:else}
        <ImageOff class="size-6" />
        <span class="text-xs">沒有封面</span>
      {/if}
    </div>
  {/if}
</div>
