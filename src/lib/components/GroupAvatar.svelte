<script lang="ts">
  let {
    url,
    name,
    class: className = 'size-10'
  }: { url: string | null; name: string; class?: string } = $props();

  let failed = $state(false);
  // 沒有頭像時用名稱的第一個字。
  const initial = $derived([...name.trim()][0]?.toUpperCase() ?? '?');
</script>

{#if url && !failed}
  <img
    src={url}
    alt=""
    onerror={() => (failed = true)}
    class="shrink-0 rounded-lg bg-cloud-200 object-cover {className}"
  />
{:else}
  <span
    aria-hidden="true"
    class="grid shrink-0 place-items-center rounded-lg bg-cloud-600 font-display font-bold text-white {className}"
  >
    {initial}
  </span>
{/if}
