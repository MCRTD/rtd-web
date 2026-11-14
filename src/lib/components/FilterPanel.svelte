<script lang="ts">
  import { Checkbox, Label } from 'bits-ui';
  import { Check } from '@lucide/svelte';
  import type { Tag } from '#lib/api.js';
  import VersionSelect from './VersionSelect.svelte';

  let {
    tags,
    selected,
    version,
    onTags,
    onVersion,
    onReset
  }: {
    tags: Tag[];
    selected: string[];
    version: string;
    onTags: (tags: string[]) => void;
    onVersion: (version: string) => void;
    onReset: () => void;
  } = $props();

  function toggle(slug: string, checked: boolean) {
    onTags(checked ? [...selected, slug] : selected.filter((s) => s !== slug));
  }
</script>

<div class="flex flex-col gap-6 rounded-lg border border-cloud-300 bg-white p-4">
  <section class="flex flex-col gap-2">
    <h2 class="text-xs font-bold tracking-wider text-cloud-600">遊戲版本</h2>
    <VersionSelect value={version} onChange={onVersion} />
  </section>

  {#if tags.length}
    <section class="flex flex-col gap-1">
      <h2 class="mb-1 text-xs font-bold tracking-wider text-cloud-600">分類</h2>
      {#each tags as tag (tag.slug)}
        <Label.Root
          for="tag-{tag.slug}"
          class="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1 text-sm text-cloud-900 hover:bg-cloud-50"
        >
          <Checkbox.Root
            id="tag-{tag.slug}"
            checked={selected.includes(tag.slug)}
            onCheckedChange={(checked) => toggle(tag.slug, checked)}
            class="flex size-4 shrink-0 items-center justify-center rounded border border-cloud-400 bg-white data-[state=checked]:border-cloud-600 data-[state=checked]:bg-cloud-600"
          >
            {#snippet children({ checked })}
              {#if checked}<Check class="size-3 text-white" strokeWidth={3} />{/if}
            {/snippet}
          </Checkbox.Root>
          {tag.name}
        </Label.Root>
      {/each}
    </section>
  {/if}

  {#if selected.length || version}
    <button
      type="button"
      onclick={onReset}
      class="h-8 rounded-md border border-cloud-300 text-sm text-cloud-700 transition-colors hover:border-cloud-500 hover:text-cloud-900"
    >
      清除篩選
    </button>
  {/if}
</div>
