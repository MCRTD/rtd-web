<script lang="ts">
  import { FileBox, Upload } from '@lucide/svelte';
  import { MC_VERSIONS, SITE_NAME } from '#lib/config.js';
  import { formatBytes } from '#lib/format.js';
  import FileDrop from '#lib/components/FileDrop.svelte';
  import VersionSelect from '#lib/components/VersionSelect.svelte';
  import Viewer3D from '#lib/components/Viewer3D.svelte';

  let file = $state<File | null>(null);
  let version = $state('');
  let message = $state<string | null>(null);

  function pickFile(files: File[]) {
    const [picked] = files;
    if (!picked.name.toLowerCase().endsWith('.litematic')) {
      message = '目前只支援 .litematic 檔案。';
      return;
    }
    message = null;
    file = picked;
  }

  const section = 'flex flex-col gap-4 rounded-lg border border-cloud-300 bg-white p-5 sm:p-6';
</script>

<svelte:head>
  <title>工具 · {SITE_NAME}</title>
</svelte:head>

<div class="container-page max-w-5xl py-8">
  <h1 class="mb-6 text-2xl font-bold text-cloud-950">工具</h1>

  <section class={section}>
    <div>
      <h2 class="font-bold text-cloud-950">線上檢視藍圖</h2>
      <p class="mt-1 text-sm text-cloud-700">
        選擇本機的 .litematic 檔案，直接在瀏覽器裡以 3D 檢視。檔案只在你的電腦上讀取，不會上傳。
      </p>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      {#if file}
        <div
          class="flex flex-1 items-center gap-3 rounded-lg border border-cloud-300 bg-cloud-50 p-3"
        >
          <FileBox class="size-8 shrink-0 text-cloud-600" strokeWidth={1.5} />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-cloud-950">{file.name}</p>
            <p class="text-xs text-cloud-600">{formatBytes(file.size)}</p>
          </div>
          <FileDrop accept=".litematic" onFiles={pickFile} class="w-auto! border-solid px-3 py-1.5">
            {#snippet children({ dragging })}
              <span class="text-sm text-cloud-700">{dragging ? '放開以更換' : '更換'}</span>
            {/snippet}
          </FileDrop>
        </div>
      {:else}
        <FileDrop accept=".litematic" onFiles={pickFile} class="flex-1 px-6 py-8">
          {#snippet children({ dragging })}
            <div class="flex flex-col items-center gap-2 text-cloud-700">
              <Upload class="size-8 text-cloud-500" strokeWidth={1.5} />
              <p class="font-medium text-cloud-900">
                {dragging ? '放開以選擇檔案' : '拖曳檔案到這裡，或點擊選擇'}
              </p>
              <p class="text-xs">支援 .litematic</p>
            </div>
          {/snippet}
        </FileDrop>
      {/if}

      <label class="flex flex-col gap-1.5 sm:w-48">
        <span class="text-sm font-medium text-cloud-800">材質版本</span>
        <VersionSelect
          value={version}
          onChange={(v) => (version = v)}
          placeholder={`預設（${MC_VERSIONS[0]}）`}
          label="材質版本"
        />
      </label>
    </div>

    {#if message}
      <p class="text-sm text-amber-700">{message}</p>
    {/if}

    {#if file}
      <Viewer3D {file} {version} />
    {/if}
  </section>
</div>
