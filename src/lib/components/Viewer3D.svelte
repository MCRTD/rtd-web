<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Slider } from 'bits-ui';
  import {
    LoaderCircle,
    Maximize,
    Minimize,
    Moon,
    Sun,
    Sunset,
    TriangleAlert
  } from '@lucide/svelte';
  import { previewUrl } from '#lib/api.js';
  import { MC_VERSIONS } from '#lib/config.js';
  import type { App } from '#lib/viewer/pkg/web.js';

  /** 傳 `id` 顯示網站上的藍圖預覽，傳 `file` 顯示本機的 .litematic。 */
  let {
    id,
    file,
    version = null
  }: { id?: string; file?: File | null; version?: string | null } = $props();

  type Time = 'day' | 'sunset' | 'night';
  type Target = { id?: string; file?: File | null; version: string };
  const times = [
    { value: 'day', label: '白天', icon: Sun },
    { value: 'sunset', label: '黃昏', icon: Sunset },
    { value: 'night', label: '夜晚', icon: Moon }
  ] as const;

  let root = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let phase = $state<'loading' | 'ready' | 'error'>('loading');
  let message = $state('');
  let layers = $state(0);
  let layer = $state(0);
  let time = $state<Time>('day');
  let fullscreen = $state(false);
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;

  let viewer: typeof import('#lib/viewer/pkg/web.js') | null = null;
  let app: App | null = null;
  let loadedVersion: string | null = null;
  let destroyed = false;
  let queue = Promise.resolve();
  let seq = 0;

  const textureVersion = $derived(version || MC_VERSIONS[0]);

  // 來源或材質版本改變時重新載入；排隊執行，過期的請求會被略過。
  $effect(() => {
    const target: Target = { id, file, version: textureVersion };
    if (!canvas || (!target.id && !target.file)) return;
    const token = ++seq;
    queue = queue.then(() => show(token, target));
  });

  async function setup(el: HTMLCanvasElement) {
    if (app) return app;
    message = '載入預覽器';
    viewer = await import('#lib/viewer/pkg/web.js');
    await viewer.default();
    app = new viewer.App(el);
    app.set_progress((fraction) => (message = `建立模型 ${Math.round(fraction * 100)}%`));
    return app;
  }

  async function show(token: number, target: Target) {
    const stale = () => destroyed || token !== seq;
    if (stale() || !canvas) return;
    phase = 'loading';
    try {
      const app = await setup(canvas);
      if (stale()) return;

      const bytes = target.file
        ? target.file.arrayBuffer().then((b) => new Uint8Array(b))
        : fetch(previewUrl(target.id!)).then(async (res) => {
            if (!res.ok) throw new Error(`預覽資料讀取失敗（${res.status}）`);
            return new Uint8Array(await res.arrayBuffer());
          });
      bytes.catch(() => {});

      if (loadedVersion !== target.version) {
        message = '下載方塊資料';
        const assets = await viewer!.load_vanilla(target.version, (text) => (message = text));
        if (stale()) return;
        await app.set_vanilla(assets);
        loadedVersion = target.version;
      }

      const data = await bytes;
      if (stale()) return;
      message = '建立模型';
      if (target.file) await app.load_schematic(data);
      else await app.load_preview(data);
      if (stale()) return;

      layers = app.layer_count;
      layer = layers;
      app.set_time(time);
      phase = 'ready';
    } catch (e) {
      if (stale()) return;
      phase = 'error';
      message = e instanceof Error ? e.message : String(e);
    }
  }

  function setLayer(value: number) {
    layer = value;
    app?.set_layer(value < layers ? value : undefined);
  }

  function setTime(value: Time) {
    time = value;
    try {
      app?.set_time(value);
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root?.requestFullscreen();
    } catch (e) {
      console.error(e);
    }
    canvas?.focus();
  }

  function onKey(event: KeyboardEvent) {
    if (phase !== 'ready') return;
    if (canFullscreen && (event.key === 'f' || event.key === 'F')) {
      event.preventDefault();
      toggleFullscreen();
      return;
    }
    if (layers < 2) return;
    const step = ({ PageUp: 1, ']': 1, PageDown: -1, '[': -1 } as Record<string, number>)[
      event.key
    ];
    if (step) {
      event.preventDefault();
      setLayer(Math.min(layers, Math.max(1, layer + step)));
    } else if (event.key === 'Escape' && !fullscreen) {
      setLayer(layers);
    }
  }

  onDestroy(() => {
    destroyed = true;
    app?.destroy();
    app = null;
  });

  const control =
    'rounded p-1.5 text-cloud-200 transition-colors hover:bg-cloud-800 hover:text-white';
</script>

<svelte:document
  onfullscreenchange={() => (fullscreen = !!root && document.fullscreenElement === root)}
/>

<div bind:this={root} class="flex flex-col gap-3 {fullscreen ? 'h-full bg-cloud-950 p-3' : ''}">
  <div
    class="relative overflow-hidden rounded-lg border bg-cloud-900 {fullscreen
      ? 'min-h-0 flex-1 border-cloud-800'
      : 'aspect-video border-cloud-300'}"
  >
    <canvas
      bind:this={canvas}
      tabindex="0"
      onkeydown={onKey}
      oncontextmenu={(e) => e.preventDefault()}
      class="size-full touch-none outline-none"
      class:invisible={phase !== 'ready'}
    ></canvas>

    {#if phase !== 'ready'}
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-cloud-100"
      >
        {#if phase === 'loading'}
          <LoaderCircle class="size-8 animate-spin text-cloud-400" />
          <p class="text-sm text-cloud-300">{message}</p>
        {:else}
          <TriangleAlert class="size-8 text-amber-300" />
          <p class="max-w-md text-sm break-words text-cloud-200">{message}</p>
          <p class="text-xs text-cloud-400">需要支援 WebGPU 或 WebGL2 的瀏覽器</p>
        {/if}
      </div>
    {:else}
      <div class="absolute top-3 right-3 flex gap-2">
        <div
          role="radiogroup"
          aria-label="光照"
          class="flex gap-0.5 rounded-md bg-cloud-950/70 p-0.5 backdrop-blur-sm"
        >
          {#each times as t (t.value)}
            <button
              type="button"
              role="radio"
              aria-checked={time === t.value}
              aria-label={t.label}
              title={t.label}
              onclick={() => setTime(t.value)}
              class={time === t.value ? 'rounded bg-cloud-400 p-1.5 text-cloud-950' : control}
            >
              <t.icon class="size-4" />
            </button>
          {/each}
        </div>
        {#if canFullscreen}
          <div class="rounded-md bg-cloud-950/70 p-0.5 backdrop-blur-sm">
            <button
              type="button"
              onclick={toggleFullscreen}
              aria-label={fullscreen ? '離開全螢幕' : '全螢幕'}
              title={fullscreen ? '離開全螢幕 (F)' : '全螢幕 (F)'}
              class={control}
            >
              {#if fullscreen}
                <Minimize class="size-4" />
              {:else}
                <Maximize class="size-4" />
              {/if}
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if phase === 'ready' && layers > 1}
    <div
      class="flex items-center gap-4 rounded-lg border px-4 py-3 {fullscreen
        ? 'border-cloud-800 bg-cloud-900 text-cloud-100'
        : 'border-cloud-300 bg-white text-cloud-800'}"
    >
      <span class="shrink-0 text-sm font-medium">層數</span>
      <Slider.Root
        type="single"
        value={layer}
        onValueChange={setLayer}
        min={1}
        max={layers}
        step={1}
        class="relative flex h-5 w-full touch-none items-center select-none"
      >
        <span class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-cloud-200">
          <Slider.Range class="absolute h-full bg-cloud-600" />
        </span>
        <Slider.Thumb
          index={0}
          class="block size-4 rounded-full border-2 border-cloud-600 bg-white focus-visible:outline-2 focus-visible:outline-cloud-600"
        />
      </Slider.Root>
      <span class="w-20 shrink-0 text-right font-mono text-xs opacity-80">
        {layer < layers ? `${layer} / ${layers}` : `全部 ${layers}`}
      </span>
    </div>
  {/if}
</div>
