<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { AlertDialog } from 'bits-ui';
  import {
    Check,
    ChevronRight,
    ImagePlus,
    LoaderCircle,
    RefreshCw,
    Save,
    Star,
    Trash2,
    TriangleAlert,
    X
  } from '@lucide/svelte';
  import type { Blueprint } from '#lib/api.js';
  import { MAX_IMAGES, checkImage, compareVersions, errorMessage, request } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import AuthorsEditor from '#lib/components/AuthorsEditor.svelte';
  import BlueprintFields from '#lib/components/BlueprintFields.svelte';
  import FileDrop from '#lib/components/FileDrop.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let bp = $derived(data.blueprint);

  type Fields = {
    name: string;
    description: string;
    tags: string[];
    versionMin: string;
    versionMax: string;
  };
  const fieldsOf = (b: Blueprint): Fields => ({
    name: b.name,
    description: b.description,
    tags: [...b.tags],
    versionMin: b.mc_versions.min ?? '',
    versionMax: b.mc_versions.max ?? ''
  });

  let fields = $state(untrack(() => fieldsOf(data.blueprint)));
  const saved = $derived(fieldsOf(bp));
  const dirty = $derived(
    fields.name.trim() !== saved.name ||
      fields.description !== saved.description ||
      fields.versionMin !== saved.versionMin ||
      fields.versionMax !== saved.versionMax ||
      [...fields.tags].sort().join() !== [...saved.tags].sort().join()
  );

  let saving = $state(false);
  let savedAt = $state(false);
  let formMessage = $state<string | null>(null);

  let imageBusy = $state<string | null>(null);
  let imageProgress = $state(0);
  let imageMessage = $state<string | null>(untrack(() => data.notice));

  let rerendering = $state(false);
  let renderMessage = $state<string | null>(null);

  let deleteOpen = $state(false);
  let deleting = $state(false);
  let deleteMessage = $state<string | null>(null);

  const renderBusy = $derived(bp.render.status === 'pending' || bp.render.status === 'rendering');
  const renderLabel: Record<Blueprint['render']['status'], string> = {
    pending: '等待渲染',
    rendering: '渲染中',
    done: '已完成',
    failed: '渲染失敗',
    unsupported: '不支援'
  };

  $effect(() => {
    if (!renderBusy) return;
    const timer = setInterval(async () => {
      try {
        bp = await request('GET', `/blueprints/${bp.id}`);
      } catch {}
    }, 5000);
    return () => clearInterval(timer);
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!fields.name.trim()) {
      formMessage = '名稱不能空白。';
      return;
    }
    if (
      fields.versionMin &&
      fields.versionMax &&
      compareVersions(fields.versionMin, fields.versionMax) > 0
    ) {
      formMessage = '最低版本不能比最高版本新。';
      return;
    }
    saving = true;
    formMessage = null;
    try {
      bp = await request('PATCH', `/blueprints/${bp.id}`, {
        name: fields.name.trim(),
        description: fields.description,
        tags: fields.tags,
        mc_version_min: fields.versionMin || null,
        mc_version_max: fields.versionMax || null
      });
      fields = fieldsOf(bp);
      savedAt = true;
      setTimeout(() => (savedAt = false), 2500);
    } catch (e) {
      formMessage = errorMessage(e);
    } finally {
      saving = false;
    }
  }

  async function imageAction(key: string, run: () => Promise<Blueprint>) {
    imageBusy = key;
    imageMessage = null;
    try {
      bp = await run();
    } catch (e) {
      imageMessage = errorMessage(e);
    } finally {
      imageBusy = null;
    }
  }

  function addImages(files: File[]) {
    const room = MAX_IMAGES - bp.images.length;
    const errors = files.map(checkImage).filter((m): m is string => m != null);
    const ok = files.filter((f) => !checkImage(f));
    if (ok.length > room) errors.push(`最多還能加 ${room} 張截圖。`);
    const accepted = ok.slice(0, room);
    if (!accepted.length) {
      imageMessage = errors.join(' ') || null;
      return;
    }
    const form = new FormData();
    for (const f of accepted) form.append('image', f);
    imageProgress = 0;
    imageAction('add', () =>
      request('POST', `/blueprints/${bp.id}/images`, form, (p) => (imageProgress = p))
    ).then(() => {
      if (errors.length) imageMessage = errors.join(' ');
    });
  }

  const setCover = (imageId: string | null) =>
    imageAction(`cover:${imageId}`, () =>
      request('PUT', `/blueprints/${bp.id}/cover`, { image_id: imageId })
    );

  const removeImage = (imageId: string) =>
    imageAction(`delete:${imageId}`, () =>
      request('DELETE', `/blueprints/${bp.id}/images/${imageId}`)
    );

  async function rerender() {
    rerendering = true;
    renderMessage = null;
    try {
      bp = await request('POST', `/blueprints/${bp.id}/rerender`);
    } catch (e) {
      renderMessage = errorMessage(e);
    } finally {
      rerendering = false;
    }
  }

  async function remove() {
    deleting = true;
    deleteMessage = null;
    try {
      await request('DELETE', `/blueprints/${bp.id}`);
      deleteOpen = false;
      await goto(`/users/${bp.owner.uuid}`, { invalidateAll: true });
    } catch (e) {
      deleteMessage = errorMessage(e);
      deleting = false;
    }
  }

  const section = 'flex flex-col gap-4 rounded-lg border border-cloud-300 bg-white p-5 sm:p-6';
  const heading = 'font-bold text-cloud-950';
  const primary =
    'flex h-10 items-center justify-center gap-2 rounded-lg bg-cloud-600 px-5 text-sm font-bold text-white shadow-[0_3px_0_0_var(--color-cloud-800)] transition-colors hover:bg-cloud-700 active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:bg-cloud-400 disabled:shadow-none';
  const secondary =
    'flex h-9 items-center justify-center gap-2 rounded-md border border-cloud-300 bg-white px-3 text-sm font-medium text-cloud-800 transition-colors hover:border-cloud-500 hover:bg-cloud-50 disabled:cursor-not-allowed disabled:opacity-50';
  const overlayButton =
    'flex items-center gap-1 rounded bg-black/55 px-1.5 py-1 text-xs text-white hover:bg-black/75 disabled:opacity-60';
</script>

{#snippet alert(text: string)}
  <div
    role="alert"
    class="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
  >
    <TriangleAlert class="mt-0.5 size-4 shrink-0" />
    <span>{text}</span>
  </div>
{/snippet}

<svelte:head>
  <title>編輯 {bp.name} · {SITE_NAME}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="container-page max-w-3xl py-8">
  <nav aria-label="導覽路徑" class="mb-4 flex items-center gap-1 text-sm text-cloud-600">
    <a href="/blueprints/{bp.id}" class="line-clamp-1 hover:text-cloud-900 hover:underline"
      >{bp.name}</a
    >
    <ChevronRight class="size-3.5 shrink-0" />
    <span class="text-cloud-900">編輯</span>
  </nav>

  <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-2xl font-bold text-cloud-950">編輯藍圖</h1>
    <a href="/blueprints/{bp.id}" class={secondary}>查看藍圖頁面</a>
  </div>

  <div class="flex flex-col gap-5">
    <form onsubmit={save} class={section}>
      <h2 class={heading}>基本資料</h2>
      <BlueprintFields
        bind:name={fields.name}
        bind:description={fields.description}
        bind:tags={fields.tags}
        bind:versionMin={fields.versionMin}
        bind:versionMax={fields.versionMax}
        minPlaceholder="未標示"
        nameRequired
      />
      {#if formMessage}{@render alert(formMessage)}{/if}
      <div class="flex items-center justify-end gap-3">
        {#if savedAt}
          <span class="flex items-center gap-1 text-sm text-cloud-700" aria-live="polite"
            ><Check class="size-4" />已儲存</span
          >
        {:else if dirty}
          <button
            type="button"
            onclick={() => (fields = fieldsOf(bp))}
            class="text-sm text-cloud-700 hover:underline"
          >
            復原變更
          </button>
        {/if}
        <button type="submit" disabled={!dirty || saving} class={primary}>
          {#if saving}<LoaderCircle class="size-4 animate-spin" />{:else}<Save
              class="size-4"
            />{/if}
          儲存變更
        </button>
      </div>
    </form>

    <section class={section}>
      <div>
        <h2 class={heading}>共同作者</h2>
        <p class="text-sm text-cloud-700">
          共同作者會顯示在藍圖頁面，也能把藍圖加入自己的群組，但不能編輯或刪除藍圖。
        </p>
      </div>
      <AuthorsEditor blueprint={bp} onchange={(b) => (bp = b)} />
    </section>

    <section class={section}>
      <div class="flex items-baseline justify-between">
        <h2 class={heading}>截圖與封面</h2>
        <span class="text-xs text-cloud-600">{bp.images.length} / {MAX_IMAGES}</span>
      </div>

      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <li class="relative overflow-hidden rounded-md border border-cloud-300 bg-cloud-200">
          {#if bp.render.url}
            <img src={bp.render.url} alt="自動渲染" class="aspect-video w-full object-cover" />
          {:else}
            <div class="flex aspect-video items-center justify-center text-xs text-cloud-700">
              {renderBusy ? '封面產生中' : '沒有渲染圖'}
            </div>
          {/if}
          <div class="absolute inset-x-0 top-0 flex p-1.5">
            <button
              type="button"
              disabled={imageBusy != null || bp.cover.source !== 'image'}
              onclick={() => setCover(null)}
              title={bp.cover.source === 'image' ? '改用自動渲染當封面' : '目前的封面'}
              class={overlayButton}
            >
              {#if imageBusy === 'cover:null'}<LoaderCircle
                  class="size-3.5 animate-spin"
                />{:else}<Star
                  class="size-3.5 {bp.cover.source !== 'image'
                    ? 'fill-amber-300 text-amber-300'
                    : ''}"
                />{/if}
              {bp.cover.source !== 'image' ? '封面' : ''}
            </button>
          </div>
          <p class="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1 text-xs text-white">
            自動渲染
          </p>
        </li>

        {#each bp.images as image, i (image.id)}
          {@const isCover = bp.cover.image_id === image.id}
          <li class="relative overflow-hidden rounded-md border border-cloud-300 bg-cloud-200">
            <img src={image.url} alt="截圖 {i + 1}" class="aspect-video w-full object-cover" />
            <div class="absolute inset-x-0 top-0 flex justify-between p-1.5">
              <button
                type="button"
                disabled={imageBusy != null || isCover}
                onclick={() => setCover(image.id)}
                title={isCover ? '目前的封面' : '設為封面'}
                class={overlayButton}
              >
                {#if imageBusy === `cover:${image.id}`}<LoaderCircle
                    class="size-3.5 animate-spin"
                  />{:else}<Star
                    class="size-3.5 {isCover ? 'fill-amber-300 text-amber-300' : ''}"
                  />{/if}
                {isCover ? '封面' : ''}
              </button>
              <button
                type="button"
                disabled={imageBusy != null}
                onclick={() => removeImage(image.id)}
                aria-label="刪除截圖 {i + 1}"
                class={overlayButton}
              >
                {#if imageBusy === `delete:${image.id}`}<LoaderCircle
                    class="size-3.5 animate-spin"
                  />{:else}<X class="size-3.5" />{/if}
              </button>
            </div>
          </li>
        {/each}
      </ul>

      {#if bp.images.length < MAX_IMAGES}
        <FileDrop
          accept="image/png,image/jpeg,image/webp"
          multiple
          onFiles={addImages}
          disabled={imageBusy != null}
          class="px-6 py-6"
        >
          {#snippet children({ dragging })}
            <div class="flex items-center justify-center gap-2 text-sm text-cloud-700">
              {#if imageBusy === 'add'}
                <LoaderCircle class="size-5 animate-spin text-cloud-500" />
                {imageProgress < 1 ? `上傳中 ${Math.round(imageProgress * 100)}%` : '處理中…'}
              {:else}
                <ImagePlus class="size-5 text-cloud-500" />
                {dragging ? '放開以加入截圖' : '加入截圖（PNG、JPEG、WebP，每張 10 MB 以內）'}
              {/if}
            </div>
          {/snippet}
        </FileDrop>
      {/if}
      {#if imageMessage}{@render alert(imageMessage)}{/if}
    </section>

    {#if bp.format === 'litematic'}
      <section class={section}>
        <h2 class={heading}>自動渲染</h2>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="text-sm text-cloud-800">
            <p>
              狀態：<span class="font-medium">{renderLabel[bp.render.status]}</span>
              {#if renderBusy}<LoaderCircle class="ml-1 inline size-3.5 animate-spin" />{/if}
            </p>
            {#if bp.render.mc_version}<p class="text-xs text-cloud-600">
                材質版本 {bp.render.mc_version}
              </p>{/if}
            {#if bp.render.status === 'failed' && bp.render.error}
              <p class="mt-1 font-mono text-xs break-all text-cloud-700">{bp.render.error}</p>
            {/if}
          </div>
          <button
            type="button"
            onclick={rerender}
            disabled={rerendering || renderBusy}
            class={secondary}
          >
            <RefreshCw class="size-4 {rerendering ? 'animate-spin' : ''}" />
            重新渲染
          </button>
        </div>
        {#if renderMessage}{@render alert(renderMessage)}{/if}
      </section>
    {/if}

    <section
      class="flex flex-col gap-3 rounded-lg border border-red-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div>
        <h2 class="font-bold text-red-800">刪除藍圖</h2>
        <p class="text-sm text-cloud-700">檔案、截圖與下載紀錄會一併刪除，無法復原。</p>
      </div>
      <AlertDialog.Root bind:open={deleteOpen}>
        <AlertDialog.Trigger
          class="flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          <Trash2 class="size-4" />刪除
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay class="fixed inset-0 z-50 bg-cloud-950/50" />
          <AlertDialog.Content
            class="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-cloud-300 bg-white p-6 shadow-xl"
          >
            <AlertDialog.Title class="text-lg font-bold text-cloud-950"
              >確定要刪除「{bp.name}」？</AlertDialog.Title
            >
            <AlertDialog.Description class="text-sm leading-relaxed text-cloud-800">
              藍圖檔案、截圖與下載紀錄會永久刪除，無法復原。
            </AlertDialog.Description>
            {#if deleteMessage}{@render alert(deleteMessage)}{/if}
            <div class="flex justify-end gap-2">
              <AlertDialog.Cancel class={secondary} disabled={deleting}>取消</AlertDialog.Cancel>
              <button
                type="button"
                onclick={remove}
                disabled={deleting}
                class="flex h-9 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {#if deleting}<LoaderCircle class="size-4 animate-spin" />{/if}
                永久刪除
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  </div>
</div>
