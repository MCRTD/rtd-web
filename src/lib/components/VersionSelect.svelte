<script lang="ts">
  import { Select } from 'bits-ui';
  import { Check, ChevronsUpDown } from '@lucide/svelte';
  import { MC_VERSIONS } from '#lib/config.js';

  let {
    value,
    onChange,
    placeholder = '所有版本',
    label: ariaLabel = 'Minecraft 版本',
    id
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    id?: string;
  } = $props();

  const versions = $derived(
    value && !MC_VERSIONS.includes(value) ? [value, ...MC_VERSIONS] : MC_VERSIONS
  );
  const items = $derived([
    { value: '', label: placeholder },
    ...versions.map((v) => ({ value: v, label: v }))
  ]);
  const label = $derived(items.find((item) => item.value === value)?.label ?? value);
</script>

<Select.Root type="single" {value} onValueChange={onChange} {items}>
  <Select.Trigger
    class="flex h-9 w-full items-center justify-between rounded-md border border-cloud-300 bg-white px-3 text-sm text-cloud-900 transition-colors hover:border-cloud-500 data-[state=open]:border-cloud-600"
    aria-label={ariaLabel}
    {id}
  >
    {label}
    <ChevronsUpDown class="size-4 text-cloud-500" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      sideOffset={4}
      class="z-50 max-h-72 w-(--bits-select-anchor-width) overflow-y-auto rounded-md border border-cloud-300 bg-white p-1 shadow-lg"
    >
      <Select.Viewport>
        {#each items as item (item.value)}
          <Select.Item
            value={item.value}
            label={item.label}
            class="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-cloud-900 select-none data-highlighted:bg-cloud-100"
          >
            {#snippet children({ selected })}
              {item.label}
              {#if selected}<Check class="size-4 text-cloud-600" />{/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
