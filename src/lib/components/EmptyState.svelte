<script lang="ts">
  import type { Snippet } from 'svelte';
  import { PackageOpen } from '@lucide/svelte';

  let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div
  class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-cloud-400 bg-cloud-50 px-6 py-16 text-center"
>
  <PackageOpen class="size-10 text-cloud-500" strokeWidth={1.5} />
  <p class="font-bold text-cloud-800">{title}</p>
  {#if children}
    <div class="text-sm text-cloud-600">{@render children()}</div>
  {/if}
</div>
