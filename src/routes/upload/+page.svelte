<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { FileBox, ImagePlus, LoaderCircle, Star, TriangleAlert, Upload, X } from '@lucide/svelte';
  import type { Blueprint } from '#lib/api.js';
  import {
    MAX_IMAGES,
    checkImage,
    compareVersions,
    errorMessage,
    isBlueprintFile,
    request
  } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import { formatBytes } from '#lib/format.js';
  import BlueprintFields from '#lib/components/BlueprintFields.svelte';
  import FileDrop from '#lib/components/FileDrop.svelte';

  type Shot = { file: File; url: string };

  let file = $state<File | null>(null);
  let name = $state('');
  let description = $state('');
  let tags = $state<string[]>([]);
  let versionMin = $state('');
  let versionMax = $state('');
  let shots = $state<Shot[]>([]);
  let coverIndex = $state(-1);

  let message = $state<string | null>(null);
  let stage = $state<'idle' | 'file' | 'images' | 'done'>('idle');
  let progress = $state(0);

  const busy = $derived(stage !== 'idle');
  const isSchem = $derived(file?.name.toLowerCase().endsWith('.schem') ?? false);
  const effectiveCover = $derived(coverIndex === -1 && isSchem && shots.length ? 0 : coverIndex);

  function pickFile(files: File[]) {
    const [picked] = files;
    if (!isBlueprintFile(picked)) {
      message = '只支援 .litematic 或 .schem 檔案。';
      return;
    }
    message = null;
    file = picked;
  }

  function addShots(files: File[]) {
    const errors: string[] = [];
    const added: Shot[] = [];
    for (const f of files) {
      const problem = checkImage(f);
      if (problem) errors.push(problem);
      else if (shots.length + added.length >= MAX_IMAGES) {
        errors.push(`最多 ${MAX_IMAGES} 張截圖。`);
        break;
      } else added.push({ file: f, url: URL.createObjectURL(f) });
    }
    shots = [...shots, ...added];
    message = errors.length ? errors.join(' ') : null;
  }

  function removeShot(index: number) {
    URL.revokeObjectURL(shots[index].url);
    shots = shots.filter((_, i) => i !== index);
    if (coverIndex === index) coverIndex = -1;
    else if (coverIndex > index) coverIndex--;
  }

  onDestroy(() => shots.forEach((s) => URL.revokeObjectURL(s.url)));

  $effect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!file) {
      message = '請選擇藍圖檔案。';
      return;
    }
    if (versionMin && versionMax && compareVersions(versionMin, versionMax) > 0) {
      message = '最低版本不能比最高版本新。';
      return;
    }
    message = null;

    const form = new FormData();
    form.set('file', file);
    if (name.trim()) form.set('name', name.trim());
    if (description.trim()) form.set('description', description.trim());
    for (const tag of tags) form.append('tags', tag);
    if (versionMin) form.set('mc_version_min', versionMin);
    if (versionMax) form.set('mc_version_max', versionMax);

    let blueprint: Blueprint;
    try {
      stage = 'file';
      progress = 0;
      blueprint = await request('POST', '/blueprints', form, (p) => (progress = p));
    } catch (e) {
      stage = 'idle';
      message = errorMessage(e);
      return;
    }

    if (shots.length) {
      try {
        stage = 'images';
        progress = 0;
        const images = new FormData();
        for (const shot of shots) images.append('image', shot.file);
        blueprint = await request(
          'POST',
          `/blueprints/${blueprint.id}/images`,
          images,
          (p) => (progress = p)
        );
        const chosen = blueprint.images[effectiveCover];
        if (chosen)
          await request('PUT', `/blueprints/${blueprint.id}/cover`, { image_id: chosen.id });
      } catch (e) {
        stage = 'done';
        const params = new URLSearchParams({
          notice: `藍圖已上傳，但截圖沒有成功：${errorMessage(e)}`
        });
        await goto(`/blueprints/${blueprint.id}/edit?${params}`);
        return;
      }
    }

    stage = 'done';
    await goto(`/blueprints/${blueprint.id}`);
  }

  const section = 'flex flex-col gap-4 rounded-lg border border-cloud-300 bg-white p-5 sm:p-6';
  const heading = 'font-bold text-cloud-950';
</script>

<svelte:head>
  <title>上傳藍圖 · {SITE_NAME}</title>
</svelte:head>

<div class="container-page max-w-3xl py-8">
  <h1 class="mb-6 text-2xl font-bold text-cloud-950">上傳藍圖</h1>

  <form onsubmit={submit} class="flex flex-col gap-5">
    <section class={section}>
      <h2 class={heading}>藍圖檔案</h2>
      {#if file}
        <div class="flex items-center gap-3 rounded-lg border border-cloud-300 bg-cloud-50 p-3">
          <FileBox class="size-8 shrink-0 text-cloud-600" strokeWidth={1.5} />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-cloud-950">{file.name}</p>
            <p class="text-xs text-cloud-600">
              {formatBytes(file.size)} · {isSchem ? 'WorldEdit' : 'Litematica'}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onclick={() => (file = null)}
            class="rounded-md px-2.5 py-1.5 text-sm text-cloud-700 hover:bg-cloud-200 disabled:opacity-50"
          >
            更換
          </button>
        </div>
        {#if isSchem}
          <p class="text-xs leading-relaxed text-cloud-700">
            .schem 目前不會自動渲染封面，也沒有 3D 預覽，建議附上截圖。
          </p>
        {/if}
      {:else}
        <FileDrop accept=".litematic,.schem" onFiles={pickFile} disabled={busy} class="px-6 py-10">
          {#snippet children({ dragging })}
            <div class="flex flex-col items-center gap-2 text-cloud-700">
              <Upload class="size-8 text-cloud-500" strokeWidth={1.5} />
              <p class="font-medium text-cloud-900">
                {dragging ? '放開以選擇檔案' : '拖曳檔案到這裡，或點擊選擇'}
              </p>
              <p class="text-xs">支援 .litematic、.schem</p>
            </div>
          {/snippet}
        </FileDrop>
      {/if}
    </section>

    <section class={section}>
      <h2 class={heading}>基本資料</h2>
      <BlueprintFields
        bind:name
        bind:description
        bind:tags
        bind:versionMin
        bind:versionMax
        namePlaceholder="留空時使用檔案內的名稱"
        minPlaceholder="依檔案自動判斷"
      />
    </section>

    <section class={section}>
      <div class="flex items-baseline justify-between">
        <h2 class={heading}>截圖</h2>
        <span class="text-xs text-cloud-600">{shots.length} / {MAX_IMAGES}</span>
      </div>
      <p class="-mt-2 text-sm text-cloud-700">
        可選，PNG、JPEG 或 WebP，每張 10 MB 以內。點星號設為封面；沒有選的話會用自動渲染的圖。
      </p>

      {#if shots.length}
        <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {#each shots as shot, i (shot.url)}
            {@const isCover = effectiveCover === i}
            <li
              class="group relative overflow-hidden rounded-md border border-cloud-300 bg-cloud-200"
            >
              <img src={shot.url} alt="截圖 {i + 1}" class="aspect-video w-full object-cover" />
              <div class="absolute inset-x-0 top-0 flex justify-between p-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onclick={() => (coverIndex = isCover ? -1 : i)}
                  aria-pressed={isCover}
                  title={isCover ? '取消封面' : '設為封面'}
                  class="flex items-center gap-1 rounded bg-black/55 px-1.5 py-1 text-xs text-white hover:bg-black/75"
                >
                  <Star class="size-3.5 {isCover ? 'fill-amber-300 text-amber-300' : ''}" />
                  {#if isCover}封面{/if}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onclick={() => removeShot(i)}
                  aria-label="移除截圖 {i + 1}"
                  class="rounded bg-black/55 p-1 text-white hover:bg-black/75"
                >
                  <X class="size-3.5" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}

      {#if shots.length < MAX_IMAGES}
        <FileDrop
          accept="image/png,image/jpeg,image/webp"
          multiple
          onFiles={addShots}
          disabled={busy}
          class="px-6 py-6"
        >
          {#snippet children({ dragging })}
            <div class="flex items-center justify-center gap-2 text-sm text-cloud-700">
              <ImagePlus class="size-5 text-cloud-500" />
              {dragging ? '放開以加入截圖' : '加入截圖'}
            </div>
          {/snippet}
        </FileDrop>
      {/if}
    </section>

    {#if message}
      <div
        role="alert"
        class="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
      >
        <TriangleAlert class="mt-0.5 size-4 shrink-0" />
        <span>{message}</span>
      </div>
    {/if}

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      {#if busy}
        <div class="flex flex-1 flex-col gap-1.5" aria-live="polite">
          <p class="text-sm text-cloud-800">
            {stage === 'file'
              ? progress < 1
                ? '上傳藍圖中…'
                : '伺服器處理中…'
              : stage === 'images'
                ? '上傳截圖中…'
                : '完成，正在前往藍圖頁面…'}
          </p>
          <div class="h-1.5 overflow-hidden rounded-full bg-cloud-200">
            <div
              class="h-full bg-cloud-600 transition-[width]"
              style="width: {stage === 'done' ? 100 : Math.round(progress * 100)}%"
            ></div>
          </div>
        </div>
      {/if}
      <button
        type="submit"
        disabled={busy || !file}
        class="flex h-12 items-center justify-center gap-2 rounded-lg bg-cloud-600 px-8 font-bold text-white shadow-[0_3px_0_0_var(--color-cloud-800)] transition-colors hover:bg-cloud-700 active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:bg-cloud-400 disabled:shadow-none"
      >
        {#if busy}<LoaderCircle class="size-5 animate-spin" />{:else}<Upload class="size-5" />{/if}
        上傳
      </button>
    </div>
  </form>
</div>
