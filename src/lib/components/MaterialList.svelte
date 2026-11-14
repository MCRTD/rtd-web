<script lang="ts">
  import { onMount } from 'svelte';
  import { LoaderCircle, Search } from '@lucide/svelte';
  import { getMaterials, type Materials } from '#lib/api.js';
  import { errorMessage } from '#lib/client.js';
  import { formatNumber, formatStacks, itemName } from '#lib/format.js';
  import CopyButton from './CopyButton.svelte';

  let { id }: { id: string } = $props();

  let data = $state<Materials | null>(null);
  let message = $state<string | null>(null);
  let filter = $state('');

  onMount(async () => {
    try {
      data = await getMaterials(fetch, id);
    } catch (e: any) {
      // getMaterials 用 SvelteKit 的 error()，訊息在 body 裡。
      message = e?.body?.message ?? errorMessage(e);
    }
  });

  const shown = $derived.by(() => {
    const needle = filter.trim().toLowerCase().replaceAll(' ', '_');
    const items = data?.items ?? [];
    return needle ? items.filter((m) => m.item.toLowerCase().includes(needle)) : items;
  });

  const asText = $derived(
    (data?.items ?? []).map((m) => `${itemName(m.item)}\t${m.count}`).join('\n')
  );
</script>

<div class="flex flex-col gap-3 rounded-lg border border-cloud-300 bg-white p-4">
  {#if message}
    <p class="py-8 text-center text-sm text-cloud-700">{message}</p>
  {:else if !data}
    <p class="flex items-center justify-center gap-2 py-8 text-sm text-cloud-700">
      <LoaderCircle class="size-4 animate-spin" />計算材料中…
    </p>
  {:else if !data.items.length}
    <p class="py-8 text-center text-sm text-cloud-700">這個藍圖沒有需要的材料。</p>
  {:else}
    <div class="flex flex-wrap items-center gap-3">
      <p class="text-sm text-cloud-800">
        共 <strong>{formatNumber(data.items.length)}</strong> 種、<strong
          >{formatNumber(data.total)}</strong
        >
        個
        <span class="text-cloud-600">（約 {formatStacks(data.total)}）</span>
      </p>
      <label class="relative ml-auto w-full sm:w-56">
        <span class="sr-only">搜尋材料</span>
        <Search
          class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-cloud-500"
        />
        <input
          type="search"
          bind:value={filter}
          placeholder="搜尋材料"
          class="h-9 w-full rounded-md border border-cloud-300 pr-3 pl-8 text-sm focus:border-cloud-600 focus:outline-none"
        />
      </label>
      <span class="flex items-center gap-1 text-sm text-cloud-700">
        複製清單<CopyButton value={asText} label="複製材料清單" />
      </span>
    </div>

    <div class="max-h-[32rem] overflow-y-auto rounded-md border border-cloud-200">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-cloud-50 text-left text-xs text-cloud-700">
          <tr>
            <th class="px-3 py-2 font-medium">物品</th>
            <th class="px-3 py-2 text-right font-medium">數量</th>
            <th class="hidden px-3 py-2 text-right font-medium sm:table-cell">換算</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-cloud-100">
          {#each shown as m (m.item)}
            <tr class="hover:bg-cloud-50">
              <td class="px-3 py-1.5">
                <span class="text-cloud-950 capitalize">{itemName(m.item)}</span>
                <span class="block font-mono text-[11px] text-cloud-500">{m.item}</span>
              </td>
              <td class="px-3 py-1.5 text-right font-medium tabular-nums"
                >{formatNumber(m.count)}</td
              >
              <td class="hidden px-3 py-1.5 text-right text-cloud-700 sm:table-cell"
                >{formatStacks(m.count)}</td
              >
            </tr>
          {:else}
            <tr><td colspan="3" class="px-3 py-6 text-center text-cloud-600">沒有符合的材料</td></tr
            >
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
