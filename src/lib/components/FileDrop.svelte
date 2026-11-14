<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    accept,
    multiple = false,
    disabled = false,
    onFiles,
    class: className = '',
    children
  }: {
    accept: string;
    multiple?: boolean;
    disabled?: boolean;
    onFiles: (files: File[]) => void;
    class?: string;
    children: Snippet<[{ dragging: boolean }]>;
  } = $props();

  let input = $state<HTMLInputElement>();
  let depth = $state(0);
  const dragging = $derived(depth > 0);

  function take(list: FileList | null | undefined) {
    const files = Array.from(list ?? []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }
</script>

<button
  type="button"
  {disabled}
  onclick={() => input?.click()}
  ondragenter={(e) => {
    e.preventDefault();
    if (!disabled) depth++;
  }}
  ondragleave={() => (depth = Math.max(0, depth - 1))}
  ondragover={(e) => e.preventDefault()}
  ondrop={(e) => {
    e.preventDefault();
    depth = 0;
    if (!disabled) take(e.dataTransfer?.files);
  }}
  data-dragging={dragging || undefined}
  class="w-full rounded-lg border-2 border-dashed border-cloud-400 bg-cloud-50 text-center transition-colors hover:border-cloud-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 data-dragging:border-cloud-600 data-dragging:bg-cloud-200 {className}"
>
  {@render children({ dragging })}
</button>
<input
  bind:this={input}
  type="file"
  {accept}
  {multiple}
  class="hidden"
  onchange={(e) => {
    take(e.currentTarget.files);
    e.currentTarget.value = '';
  }}
/>
