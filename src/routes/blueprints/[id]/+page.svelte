<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { Tabs } from 'bits-ui';
  import { ChevronRight, Download, LoaderCircle, Pencil, UserMinus } from '@lucide/svelte';
  import { avatarUrl, downloadUrl } from '#lib/api.js';
  import { errorMessage, request } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import {
    formatBytes,
    formatDate,
    formatNumber,
    formatSize,
    formatVersionRange
  } from '#lib/format.js';
  import Cover from '#lib/components/Cover.svelte';
  import CopyButton from '#lib/components/CopyButton.svelte';
  import AddToGroup from '#lib/components/AddToGroup.svelte';
  import Gallery from '#lib/components/Gallery.svelte';
  import MaterialList from '#lib/components/MaterialList.svelte';
  import ReactionButtons from '#lib/components/ReactionButtons.svelte';
  import TagChip from '#lib/components/TagChip.svelte';
  import Viewer3D from '#lib/components/Viewer3D.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const bp = $derived(data.blueprint);
  const mine = $derived(data.user?.uuid === bp.owner.uuid);
  const coauthor = $derived(bp.authors.some((a) => a.uuid === data.user?.uuid));
  const people = $derived([bp.owner, ...bp.authors]);

  let leaving = $state(false);
  let leaveMessage = $state<string | null>(null);

  async function leave() {
    if (!data.user || !confirm('確定要把自己從共同作者中移除？')) return;
    leaving = true;
    leaveMessage = null;
    try {
      await request('DELETE', `/blueprints/${bp.id}/authors/${data.user.uuid}`);
      await invalidateAll();
    } catch (e) {
      leaveMessage = errorMessage(e);
    } finally {
      leaving = false;
    }
  }
  const busy = $derived(bp.render.status === 'pending' || bp.render.status === 'rendering');

  const media = $derived.by(() => {
    const shots = bp.images.map((image, i) => ({
      url: image.url,
      label: `截圖 ${i + 1}`,
      id: image.id
    }));
    const chosen = shots.findIndex((shot) => shot.id === bp.cover.image_id);
    if (chosen > 0) shots.unshift(...shots.splice(chosen, 1));
    const render = bp.render.url ? [{ url: bp.render.url, label: '自動渲染', id: 'render' }] : [];
    return bp.cover.source === 'render' ? [...render, ...shots] : [...shots, ...render];
  });

  const details = $derived(
    [
      ['格式', bp.format === 'litematic' ? 'Litematica (.litematic)' : 'WorldEdit (.schem)'],
      ['支援版本', formatVersionRange(bp.mc_versions.min, bp.mc_versions.max)],
      ['尺寸', bp.size ? formatSize(bp.size) : null],
      ['方塊數', bp.total_blocks != null ? formatNumber(bp.total_blocks) : null],
      ['檔案大小', formatBytes(bp.file.size)],
      ['下載次數', formatNumber(bp.download_count)],
      ['瀏覽次數', formatNumber(bp.view_count)],
      ['上傳日期', formatDate(bp.created_at)],
      ['最後更新', bp.updated_at !== bp.created_at ? formatDate(bp.updated_at) : null]
    ].filter((row): row is [string, string] => row[1] != null)
  );

  // 每次開啟頁面算一次瀏覽；輪詢渲染進度的 GET 不會算。
  onMount(() => {
    request('POST', `/blueprints/${bp.id}/view`, null).catch(() => {});
  });

  $effect(() => {
    if (!busy) return;
    const timer = setInterval(invalidateAll, 5000);
    return () => clearInterval(timer);
  });

  const tabClass =
    'rounded-md px-4 py-1.5 text-sm font-medium text-cloud-700 transition-colors hover:text-cloud-950 data-[state=active]:bg-white data-[state=active]:text-cloud-950 data-[state=active]:shadow-sm';
</script>

<svelte:head>
  <title>{bp.name} · {SITE_NAME}</title>
  <meta
    name="description"
    content={bp.description.slice(0, 160) || `${bp.owner.username} 上傳的 Minecraft 藍圖`}
  />
  {#if bp.cover.url}<meta property="og:image" content={bp.cover.url} />{/if}
</svelte:head>

<div class="container-page py-8">
  <nav aria-label="導覽路徑" class="mb-4 flex items-center gap-1 text-sm text-cloud-600">
    <a href="/blueprints" class="hover:text-cloud-900 hover:underline">藍圖</a>
    <ChevronRight class="size-3.5" />
    <span class="line-clamp-1 text-cloud-900">{bp.name}</span>
  </nav>

  <div class="grid gap-8 lg:grid-cols-[1fr_20rem]">
    <div class="flex min-w-0 flex-col gap-6 lg:col-start-1">
      <header class="flex flex-col gap-3">
        <h1 class="text-3xl font-bold break-words text-cloud-950">{bp.name}</h1>
        <ul class="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="作者">
          {#each people as person (person.uuid)}
            <li>
              <a
                href="/users/{person.uuid}"
                class="inline-flex items-center gap-2 text-cloud-800 hover:text-cloud-950"
              >
                <img
                  src={avatarUrl(person.uuid, 32)}
                  alt=""
                  class="size-6 rounded [image-rendering:pixelated]"
                />
                <span class="font-medium hover:underline">{person.username}</span>
              </a>
            </li>
          {/each}
        </ul>
        {#if bp.tags.length}
          <div class="flex flex-wrap gap-1.5">
            {#each bp.tags as slug (slug)}
              <TagChip {slug} />
            {/each}
          </div>
        {/if}
      </header>

      <Tabs.Root value="images" class="flex flex-col gap-3">
        {#if bp.format === 'litematic'}
          <Tabs.List class="inline-flex w-fit gap-1 rounded-lg bg-cloud-200 p-1">
            <Tabs.Trigger value="images" class={tabClass}>圖片</Tabs.Trigger>
            <Tabs.Trigger value="3d" class={tabClass}>3D 預覽</Tabs.Trigger>
            <Tabs.Trigger value="materials" class={tabClass}>所需材料</Tabs.Trigger>
          </Tabs.List>
        {/if}

        <Tabs.Content value="images">
          {#if media.length}
            <Gallery {media} title={bp.name} />
          {:else}
            <Cover blueprint={bp} class="aspect-video rounded-lg border border-cloud-300" />
            {#if bp.render.status === 'failed'}
              <p class="mt-2 text-sm text-cloud-700">封面渲染失敗，可以改用 3D 預覽查看。</p>
            {/if}
          {/if}
        </Tabs.Content>

        {#if bp.format === 'litematic'}
          <Tabs.Content value="3d">
            <Viewer3D id={bp.id} version={bp.render.mc_version} />
          </Tabs.Content>
          <Tabs.Content value="materials">
            <MaterialList id={bp.id} />
          </Tabs.Content>
        {/if}
      </Tabs.Root>
    </div>

    <aside
      class="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
    >
      <div class="flex flex-col gap-4 rounded-lg border border-cloud-300 bg-white p-5">
        <a
          href={downloadUrl(bp.id)}
          rel="nofollow"
          class="flex h-12 items-center justify-center gap-2 rounded-lg bg-cloud-600 font-bold text-white shadow-[0_3px_0_0_var(--color-cloud-800)] transition-colors hover:bg-cloud-700 active:translate-y-px active:shadow-none"
        >
          <Download class="size-5" />
          下載藍圖
        </a>
        <p class="truncate text-center font-mono text-xs text-cloud-600" title={bp.file.name}>
          {bp.file.name}
        </p>
        <ReactionButtons blueprint={bp} />
        {#if mine || coauthor}<AddToGroup blueprint={bp} />{/if}
        {#if mine}
          <a
            href="/blueprints/{bp.id}/edit"
            class="flex h-10 items-center justify-center gap-2 rounded-lg border border-cloud-300 text-sm font-medium text-cloud-800 transition-colors hover:border-cloud-500 hover:bg-cloud-50"
          >
            <Pencil class="size-4" />
            編輯藍圖
          </a>
        {:else if coauthor}
          <button
            type="button"
            onclick={leave}
            disabled={leaving}
            class="flex h-10 items-center justify-center gap-2 rounded-lg border border-cloud-300 text-sm font-medium text-cloud-800 transition-colors hover:border-cloud-500 hover:bg-cloud-50 disabled:opacity-60"
          >
            {#if leaving}<LoaderCircle class="size-4 animate-spin" />{:else}<UserMinus
                class="size-4"
              />{/if}
            退出共同作者
          </button>
          {#if leaveMessage}<p class="text-xs text-red-700" role="alert">{leaveMessage}</p>{/if}
        {/if}

        <dl class="divide-y divide-cloud-100 text-sm">
          {#each details as [term, value] (term)}
            <div class="flex justify-between gap-4 py-2">
              <dt class="shrink-0 text-cloud-600">{term}</dt>
              <dd class="text-right font-medium text-cloud-900">{value}</dd>
            </div>
          {/each}
          <div class="flex items-center justify-between gap-2 py-2">
            <dt class="shrink-0 text-cloud-600">SHA-256</dt>
            <dd class="flex min-w-0 items-center gap-1">
              <span class="truncate font-mono text-xs text-cloud-800" title={bp.file.sha256}
                >{bp.file.sha256.slice(0, 16)}…</span
              >
              <CopyButton value={bp.file.sha256} label="複製雜湊值" />
            </dd>
          </div>
        </dl>
      </div>
    </aside>

    <section class="min-w-0 rounded-lg border border-cloud-300 bg-white p-6 lg:col-start-1">
      <h2 class="mb-3 font-bold text-cloud-900">說明</h2>
      {#if bp.description.trim()}
        <p class="leading-relaxed break-words whitespace-pre-line text-cloud-900">
          {bp.description}
        </p>
      {:else}
        <p class="text-cloud-600">上傳者沒有留下說明。</p>
      {/if}
    </section>
  </div>
</div>
