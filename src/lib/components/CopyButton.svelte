<script lang="ts">
  import { Tooltip } from 'bits-ui';
  import { Check, Copy } from '@lucide/svelte';

  let { value, label }: { value: string; label: string } = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  async function copy() {
    await navigator.clipboard.writeText(value);
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 1500);
  }
</script>

<Tooltip.Root>
  <Tooltip.Trigger
    onclick={copy}
    class="inline-flex size-6 items-center justify-center rounded text-cloud-500 hover:bg-cloud-100 hover:text-cloud-800"
    aria-label={label}
  >
    {#if copied}<Check class="size-3.5" />{:else}<Copy class="size-3.5" />{/if}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content sideOffset={4} class="z-50 rounded bg-cloud-900 px-2 py-1 text-xs text-white">
      {copied ? '已複製' : label}
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
