<script lang="ts">
  import { page } from '$app/state';
  import { SITE_NAME } from '#lib/config.js';

  const title = $derived(
    page.status === 404 ? '找不到這個頁面' : page.status === 503 ? '伺服器暫時無法連線' : '發生錯誤'
  );
</script>

<svelte:head>
  <title>{title} · {SITE_NAME}</title>
</svelte:head>

<div class="container-page flex flex-col items-center gap-4 py-24 text-center">
  <p class="text-6xl font-bold text-cloud-500 tabular-nums">{page.status}</p>
  <h1 class="text-xl font-bold text-cloud-900">{title}</h1>
  {#if page.error?.message && page.error.message !== title}
    <p class="text-sm text-cloud-700">{page.error.message}</p>
  {/if}
  <a
    href="/"
    class="mt-2 rounded-lg bg-cloud-600 px-5 py-2 font-medium text-white hover:bg-cloud-700"
    >回到首頁</a
  >
</div>
