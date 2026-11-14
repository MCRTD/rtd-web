<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { LoaderCircle, X, ZoomIn } from '@lucide/svelte';

  /**
   * 在瀏覽器裡裁切圖片：拖曳移動、滾輪或滑桿縮放，輸出 `width × height` 的圖。
   * 伺服器不會再裁切，只會檢查與去除中繼資料。
   */
  let {
    file,
    aspect,
    width,
    height,
    title,
    round = false,
    onconfirm,
    oncancel
  }: {
    file: File;
    aspect: number;
    width: number;
    height: number;
    title: string;
    round?: boolean;
    onconfirm: (blob: Blob) => void | Promise<void>;
    oncancel: () => void;
  } = $props();

  let img = $state<HTMLImageElement | null>(null);
  let loadError = $state(false);
  let frame = $state<HTMLDivElement>();
  let frameW = $state(0);
  const frameH = $derived(frameW / aspect);

  let zoom = $state(1);
  let x = $state(0);
  let y = $state(0);
  let saving = $state(false);

  const base = $derived(
    img && frameW ? Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) : 1
  );
  const scale = $derived(base * zoom);

  $effect(() => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      img = el;
    };
    el.onerror = () => (loadError = true);
    el.src = url;
    return () => URL.revokeObjectURL(url);
  });

  // 圖片載入或框改變大小時置中。
  $effect(() => {
    if (!img || !frameW) return;
    const s = Math.max(frameW / img.naturalWidth, frameW / aspect / img.naturalHeight);
    zoom = 1;
    x = (frameW - img.naturalWidth * s) / 2;
    y = (frameW / aspect - img.naturalHeight * s) / 2;
  });

  function clamp() {
    if (!img) return;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    x = Math.min(0, Math.max(frameW - w, x));
    y = Math.min(0, Math.max(frameH - h, y));
  }

  /** 以框內一點為中心縮放。 */
  function zoomTo(next: number, cx = frameW / 2, cy = frameH / 2) {
    next = Math.min(4, Math.max(1, next));
    const ratio = next / zoom;
    x = cx - (cx - x) * ratio;
    y = cy - (cy - y) * ratio;
    zoom = next;
    clamp();
  }

  let drag: { id: number; sx: number; sy: number; ox: number; oy: number } | null = null;

  function down(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: x, oy: y };
  }

  function move(e: PointerEvent) {
    if (!drag || drag.id !== e.pointerId) return;
    x = drag.ox + e.clientX - drag.sx;
    y = drag.oy + e.clientY - drag.sy;
    clamp();
  }

  function wheel(e: WheelEvent) {
    e.preventDefault();
    const rect = frame!.getBoundingClientRect();
    zoomTo(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - rect.left, e.clientY - rect.top);
  }

  function key(e: KeyboardEvent) {
    const step = e.shiftKey ? 20 : 5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step]
    };
    if (moves[e.key]) {
      e.preventDefault();
      x += moves[e.key][0];
      y += moves[e.key][1];
      clamp();
    } else if (e.key === '+' || e.key === '=') zoomTo(zoom * 1.1);
    else if (e.key === '-') zoomTo(zoom / 1.1);
  }

  async function confirm() {
    if (!img) return;
    saving = true;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        -x / scale,
        -y / scale,
        frameW / scale,
        frameH / scale,
        0,
        0,
        width,
        height
      );
      // JPEG 沒有透明度；其他格式輸出 PNG 以保留透明背景。
      const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
      if (blob) await onconfirm(blob);
    } finally {
      saving = false;
    }
  }
</script>

<Dialog.Root open onOpenChange={(open) => !open && !saving && oncancel()}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-cloud-950/50" />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 flex w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg bg-white p-5 shadow-xl"
    >
      <div class="flex items-center justify-between">
        <Dialog.Title class="text-lg font-bold text-cloud-950">{title}</Dialog.Title>
        <Dialog.Close class="rounded p-1 text-cloud-600 hover:bg-cloud-100" aria-label="關閉"
          ><X class="size-5" /></Dialog.Close
        >
      </div>

      <!-- 拖曳區可以用鍵盤操作（方向鍵、+ −），role="application" 讓螢幕閱讀器把按鍵交給它。 -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        bind:this={frame}
        bind:clientWidth={frameW}
        role="application"
        aria-label="拖曳調整位置，滾輪或 + − 鍵縮放，方向鍵微調"
        tabindex="0"
        class="relative w-full cursor-grab touch-none overflow-hidden rounded-md bg-cloud-900 select-none active:cursor-grabbing"
        style:height="{frameH}px"
        onpointerdown={down}
        onpointermove={move}
        onpointerup={() => (drag = null)}
        onpointercancel={() => (drag = null)}
        onwheel={wheel}
        onkeydown={key}
      >
        {#if img}
          <img
            src={img.src}
            alt=""
            draggable="false"
            class="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
            style:width="{img.naturalWidth * scale}px"
            style:height="{img.naturalHeight * scale}px"
            style:transform="translate({x}px, {y}px)"
          />
          {#if round}
            <div
              class="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgb(0_0_0/0.45)]"
            ></div>
          {/if}
        {:else if loadError}
          <p class="absolute inset-0 grid place-items-center text-sm text-cloud-100">
            無法讀取這張圖片
          </p>
        {:else}
          <LoaderCircle
            class="absolute top-1/2 left-1/2 size-6 -translate-1/2 animate-spin text-cloud-100"
          />
        {/if}
      </div>

      <label class="flex items-center gap-3 text-sm text-cloud-700">
        <ZoomIn class="size-4 shrink-0" />
        <span class="sr-only">縮放</span>
        <input
          type="range"
          min="1"
          max="4"
          step="0.01"
          value={zoom}
          oninput={(e) => zoomTo(Number(e.currentTarget.value))}
          class="w-full accent-cloud-600"
        />
      </label>
      <p class="text-xs text-cloud-600">輸出 {width} × {height}。拖曳調整位置，滾輪或滑桿縮放。</p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick={oncancel}
          disabled={saving}
          class="h-10 rounded-lg border border-cloud-300 px-4 text-sm font-medium text-cloud-800 hover:bg-cloud-50"
        >
          取消
        </button>
        <button
          type="button"
          onclick={confirm}
          disabled={!img || saving}
          class="flex h-10 items-center gap-2 rounded-lg bg-cloud-600 px-4 text-sm font-bold text-white hover:bg-cloud-700 disabled:opacity-60"
        >
          {#if saving}<LoaderCircle class="size-4 animate-spin" />{/if}
          裁切並上傳
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
