<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { ArrowRight, Search } from '@lucide/svelte';
  import { SITE_FULL_NAME, SITE_NAME } from '#lib/config.js';
  import { formatNumber } from '#lib/format.js';
  import BlueprintGrid from '#lib/components/BlueprintGrid.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let query = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    goto(query.trim() ? `/blueprints?q=${encodeURIComponent(query.trim())}` : '/blueprints');
  }
</script>

<svelte:head>
  <title>{SITE_NAME} · {SITE_FULL_NAME}</title>
  <meta name="description" content="分享與下載 Minecraft 的 .litematic、.schem 藍圖。" />
</svelte:head>

<section class="border-b border-cloud-400 bg-cloud-300">
  <div class="container-page py-12 md:py-16">
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-1">
        <p class="font-display text-lg tracking-wide text-cloud-700">
          {SITE_NAME}
        </p>
        <h1 class="font-display text-4xl text-cloud-800 sm:text-5xl">
          {SITE_FULL_NAME}
        </h1>
      </div>
      <form onsubmit={submit} class="flex max-w-xl gap-2" role="search">
        <label class="relative flex-1">
          <span class="sr-only">搜尋藍圖</span>
          <Search
            class="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-cloud-500"
          />
          <input
            type="search"
            bind:value={query}
            placeholder="例如：刷鐵機、倉庫"
            class="h-12 w-full rounded-lg border-2 border-cloud-600 bg-white pr-4 pl-11 text-cloud-950 placeholder:text-cloud-500 focus:border-cloud-800 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          class="h-12 rounded-lg bg-cloud-700 px-6 font-medium text-white transition-colors hover:bg-cloud-800 active:translate-y-px active:shadow-none"
        >
          搜尋
        </button>
      </form>
    </div>
  </div>
</section>

{#if page.data.tags?.length}
  <section class="container-page pt-10">
    <h2 class="mb-4 text-lg font-bold text-cloud-900">分類</h2>
    <div
      class="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {#each page.data.tags as tag (tag.slug)}
        <a
          href="/blueprints?tags={tag.slug}"
          class="shrink-0 snap-start rounded-full border border-cloud-300 bg-white px-4 py-2 text-center text-sm font-medium whitespace-nowrap text-cloud-800 transition-colors hover:border-cloud-600 hover:bg-cloud-600 hover:text-white sm:rounded-lg sm:py-3 sm:text-base"
        >
          {tag.name}
        </a>
      {/each}
    </div>
  </section>
{/if}

{#if data.popular}
  <section class="container-page pt-10">
    <div class="mb-4 flex items-baseline justify-between">
      <h2 class="text-lg font-bold text-cloud-900">最多人按讚</h2>
      <a
        href="/blueprints?sort=likes"
        class="inline-flex items-center gap-1 text-sm font-medium text-cloud-700 hover:text-cloud-950"
      >
        更多<ArrowRight class="size-4" />
      </a>
    </div>
    <BlueprintGrid items={data.popular.items} />
  </section>
{/if}

<section class="container-page pt-10">
  <div class="mb-4 flex items-baseline justify-between">
    <h2 class="text-lg font-bold text-cloud-900">
      最新上傳
      <span class="ml-2 text-sm font-normal text-cloud-600"
        >共 {formatNumber(data.latest.total)} 個藍圖</span
      >
    </h2>
    <a
      href="/blueprints"
      class="inline-flex items-center gap-1 text-sm font-medium text-cloud-700 hover:text-cloud-950"
    >
      全部藍圖<ArrowRight class="size-4" />
    </a>
  </div>

  {#if data.latest.items.length}
    <BlueprintGrid items={data.latest.items} />
  {:else}
    <EmptyState title="還沒有人上傳藍圖">在 HexoLauncher 登入後就能上傳第一個藍圖。</EmptyState>
  {/if}
</section>
