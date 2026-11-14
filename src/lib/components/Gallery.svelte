<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { ChevronLeft, ChevronRight, Expand, X } from '@lucide/svelte';

  type Media = { id: string; url: string; label: string };

  let { media, title }: { media: Media[]; title: string } = $props();

  let index = $state(0);
  let open = $state(false);

  const current = $derived(media[Math.min(index, media.length - 1)]);

  const step = (delta: number) => (index = (index + delta + media.length) % media.length);

  function onKey(event: KeyboardEvent) {
    if (media.length < 2) return;
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  }
</script>

<div class="flex flex-col gap-3">
  <button
    type="button"
    onclick={() => (open = true)}
    class="group relative aspect-video overflow-hidden rounded-lg border border-cloud-300 bg-cloud-300"
    aria-label="放大檢視"
  >
    <img src={current.url} alt="{title}：{current.label}" class="size-full object-contain" />
    <span
      class="absolute top-3 right-3 rounded-md bg-cloud-950/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      <Expand class="size-4" />
    </span>
    <span class="absolute bottom-3 left-3 rounded bg-cloud-950/60 px-2 py-0.5 text-xs text-white"
      >{current.label}</span
    >
  </button>

  {#if media.length > 1}
    <div class="flex gap-2 overflow-x-auto pb-1">
      {#each media as item, i (item.id)}
        <button
          type="button"
          onclick={() => (index = i)}
          class="aspect-video w-28 shrink-0 overflow-hidden rounded-md border-2 transition-colors {i ===
          index
            ? 'border-cloud-600'
            : 'border-transparent opacity-70 hover:opacity-100'}"
          aria-label={item.label}
          aria-pressed={i === index}
        >
          <img src={item.url} alt="" loading="lazy" class="size-full object-cover" />
        </button>
      {/each}
    </div>
  {/if}
</div>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-cloud-950/90" />
    <Dialog.Content
      onkeydown={onKey}
      class="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-12"
    >
      <Dialog.Title class="sr-only">{title}</Dialog.Title>
      <img
        src={current.url}
        alt="{title}：{current.label}"
        class="max-h-full max-w-full rounded object-contain"
      />

      <Dialog.Close
        class="absolute top-4 right-4 rounded-md p-2 text-cloud-100 hover:bg-white/10"
        aria-label="關閉"
      >
        <X class="size-6" />
      </Dialog.Close>

      {#if media.length > 1}
        <button
          type="button"
          onclick={() => step(-1)}
          class="absolute top-1/2 left-2 -translate-y-1/2 rounded-md p-2 text-cloud-100 hover:bg-white/10"
          aria-label="上一張"
        >
          <ChevronLeft class="size-8" />
        </button>
        <button
          type="button"
          onclick={() => step(1)}
          class="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-cloud-100 hover:bg-white/10"
          aria-label="下一張"
        >
          <ChevronRight class="size-8" />
        </button>
        <span class="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-cloud-200"
          >{index + 1} / {media.length}</span
        >
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
