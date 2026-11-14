<script lang="ts">
  import { Pagination } from 'bits-ui';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';

  let {
    count,
    perPage,
    page,
    href
  }: { count: number; perPage: number; page: number; href: (page: number) => string } = $props();

  const button =
    'inline-flex size-9 items-center justify-center rounded-md border border-cloud-300 bg-white text-sm font-medium text-cloud-800 transition-colors hover:border-cloud-500 disabled:pointer-events-none disabled:opacity-40 data-selected:border-cloud-600 data-selected:bg-cloud-600 data-selected:text-white';
</script>

{#if count > perPage}
  <Pagination.Root {count} {perPage} {page} siblingCount={1}>
    {#snippet children({ pages, currentPage })}
      <nav aria-label="分頁" class="flex items-center justify-center gap-1.5">
        <Pagination.PrevButton>
          {#snippet child({ props })}
            {#if currentPage > 1}
              <a {...props} href={href(currentPage - 1)} class={button} aria-label="上一頁"
                ><ChevronLeft class="size-4" /></a
              >
            {:else}
              <span class="{button} pointer-events-none opacity-40"
                ><ChevronLeft class="size-4" /></span
              >
            {/if}
          {/snippet}
        </Pagination.PrevButton>

        {#each pages as item (item.key)}
          {#if item.type === 'ellipsis'}
            <span class="px-1 text-cloud-500">…</span>
          {:else}
            <Pagination.Page page={item}>
              {#snippet child({ props })}
                <a {...props} href={href(item.value)} class={button}>{item.value}</a>
              {/snippet}
            </Pagination.Page>
          {/if}
        {/each}

        <Pagination.NextButton>
          {#snippet child({ props })}
            {#if currentPage < Math.ceil(count / perPage)}
              <a {...props} href={href(currentPage + 1)} class={button} aria-label="下一頁"
                ><ChevronRight class="size-4" /></a
              >
            {:else}
              <span class="{button} pointer-events-none opacity-40"
                ><ChevronRight class="size-4" /></span
              >
            {/if}
          {/snippet}
        </Pagination.NextButton>
      </nav>
    {/snippet}
  </Pagination.Root>
{/if}
