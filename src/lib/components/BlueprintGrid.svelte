<script lang="ts">
  import type { Blueprint } from '#lib/api.js';
  import BlueprintCard from './BlueprintCard.svelte';

  let { items }: { items: Blueprint[] } = $props();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {#each items as blueprint (blueprint.id)}
    <BlueprintCard {blueprint} />
  {/each}
</div>
