<script lang="ts">
  import { MAX_DESCRIPTION_LEN, MAX_NAME_LEN } from '#lib/client.js';
  import TagPicker from './TagPicker.svelte';
  import VersionSelect from './VersionSelect.svelte';

  let {
    name = $bindable(''),
    description = $bindable(''),
    tags = $bindable([]),
    versionMin = $bindable(''),
    versionMax = $bindable(''),
    namePlaceholder = '',
    minPlaceholder = '自動判斷',
    nameRequired = false
  }: {
    name: string;
    description: string;
    tags: string[];
    versionMin: string;
    versionMax: string;
    namePlaceholder?: string;
    minPlaceholder?: string;
    nameRequired?: boolean;
  } = $props();

  const input =
    'w-full rounded-md border border-cloud-300 bg-white px-3 text-sm text-cloud-950 placeholder:text-cloud-500 transition-colors hover:border-cloud-500 focus:border-cloud-600 focus:outline-none';
  const labelClass = 'text-sm font-bold text-cloud-900';
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between">
      <label for="bp-name" class={labelClass}
        >名稱{#if nameRequired}<span class="text-red-600"> *</span>{/if}</label
      >
      <span class="text-xs text-cloud-600">{name.length} / {MAX_NAME_LEN}</span>
    </div>
    <input
      id="bp-name"
      bind:value={name}
      maxlength={MAX_NAME_LEN}
      required={nameRequired}
      placeholder={namePlaceholder}
      class="{input} h-10"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between">
      <label for="bp-description" class={labelClass}>說明</label>
      <span class="text-xs text-cloud-600">{description.length} / {MAX_DESCRIPTION_LEN}</span>
    </div>
    <textarea
      id="bp-description"
      bind:value={description}
      maxlength={MAX_DESCRIPTION_LEN}
      rows="6"
      placeholder="用途、使用方式、需要的材料、注意事項……"
      class="{input} resize-y py-2 leading-relaxed"></textarea>
  </div>

  <div class="flex flex-col gap-1.5">
    <span class={labelClass}>標籤</span>
    <TagPicker bind:value={tags} />
  </div>

  <fieldset class="flex flex-col gap-1.5">
    <legend class="{labelClass} mb-1.5">支援版本</legend>
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="flex flex-col gap-1">
        <span class="text-xs text-cloud-700">最低版本</span>
        <VersionSelect
          value={versionMin}
          onChange={(v) => (versionMin = v)}
          placeholder={minPlaceholder}
          label="最低版本"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-cloud-700">最高版本</span>
        <VersionSelect
          value={versionMax}
          onChange={(v) => (versionMax = v)}
          placeholder="沒有上限"
          label="最高版本"
        />
      </div>
    </div>
    <p class="text-xs leading-relaxed text-cloud-600">在這個範圍內的版本都能正常運作。</p>
  </fieldset>
</div>
