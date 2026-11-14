<script lang="ts">
  import { page } from '$app/state';

  let { slug, link = true }: { slug: string; link?: boolean } = $props();

  const name = $derived(page.data.tags?.find((tag) => tag.slug === slug)?.name ?? slug);
  const classes =
    'inline-flex items-center rounded bg-cloud-200 px-2 py-0.5 text-xs font-medium text-cloud-800';
</script>

{#if link}
  <a href="/blueprints?tags={slug}" class="{classes} transition-colors hover:bg-cloud-300">{name}</a
  >
{:else}
  <span class={classes}>{name}</span>
{/if}
