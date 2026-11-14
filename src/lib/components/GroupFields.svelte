<script lang="ts">
  import { page } from '$app/state';
  import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte';
  import { LINK_TYPES, type GroupLink } from '#lib/api.js';
  import {
    LINK_LABELS,
    MAX_GROUP_DESCRIPTION_LEN,
    MAX_GROUP_NAME_LEN,
    MAX_LINKS
  } from '#lib/groups.js';
  import LinkIcon from './LinkIcon.svelte';

  let {
    name = $bindable(''),
    kind = $bindable(''),
    joinPolicy = $bindable<'open' | 'invite'>('invite'),
    description = $bindable(''),
    links = $bindable<GroupLink[]>([])
  }: {
    name: string;
    kind: string;
    joinPolicy: 'open' | 'invite';
    description: string;
    links: GroupLink[];
  } = $props();

  const kinds = $derived(page.data.groupKinds ?? []);

  const input =
    'w-full rounded-md border border-cloud-300 bg-white px-3 text-sm text-cloud-950 placeholder:text-cloud-500 transition-colors hover:border-cloud-500 focus:border-cloud-600 focus:outline-none';
  const labelClass = 'text-sm font-bold text-cloud-900';

  function move(i: number, by: number) {
    const next = [...links];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    links = next;
  }

  /** 從網址猜連結類型，使用者還沒改過類型時才套用。 */
  function guess(link: GroupLink) {
    if (link.type !== 'website' && link.type !== 'other') return;
    const host = (() => {
      try {
        return new URL(link.url).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })();
    const map: [RegExp, GroupLink['type']][] = [
      [/(^|\.)discord\.(gg|com)$/, 'discord'],
      [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
      [/(^|\.)(bilibili\.com|b23\.tv)$/, 'bilibili'],
      [/(^|\.)twitch\.tv$/, 'twitch'],
      [/(^|\.)(x\.com|twitter\.com)$/, 'x'],
      [/(^|\.)github\.com$/, 'github'],
      [/(^|\.)qq\.com$/, 'qq']
    ];
    const found = map.find(([re]) => re.test(host));
    if (found) link.type = found[1];
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between">
      <label for="group-name" class={labelClass}>名稱<span class="text-red-600"> *</span></label>
      <span class="text-xs text-cloud-600">{name.length} / {MAX_GROUP_NAME_LEN}</span>
    </div>
    <input
      id="group-name"
      bind:value={name}
      maxlength={MAX_GROUP_NAME_LEN}
      required
      class="{input} h-10"
    />
  </div>

  <div class="grid gap-5 sm:grid-cols-2">
    <div class="flex flex-col gap-1.5">
      <label for="group-kind" class={labelClass}>類型<span class="text-red-600"> *</span></label>
      <select id="group-kind" bind:value={kind} required class="{input} h-10">
        {#each kinds as k (k.slug)}
          <option value={k.slug}>{k.name}</option>
        {/each}
      </select>
    </div>
    <fieldset class="flex flex-col gap-1.5">
      <legend class="{labelClass} mb-1.5">加入方式</legend>
      <div class="flex gap-2">
        {#each [['invite', '邀請制', '管理員邀請，對方接受後加入'], ['open', '公開', '任何人都能自行加入']] as [value, label, hint] (value)}
          <label
            class="flex flex-1 cursor-pointer flex-col rounded-md border px-3 py-2 text-sm has-checked:border-cloud-600 has-checked:bg-cloud-50 {joinPolicy ===
            value
              ? ''
              : 'border-cloud-300'}"
          >
            <span class="flex items-center gap-2 font-medium text-cloud-950">
              <input type="radio" bind:group={joinPolicy} {value} class="accent-cloud-600" />{label}
            </span>
            <span class="text-xs text-cloud-600">{hint}</span>
          </label>
        {/each}
      </div>
    </fieldset>
  </div>

  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between">
      <label for="group-description" class={labelClass}>簡介</label>
      <span class="text-xs text-cloud-600">{description.length} / {MAX_GROUP_DESCRIPTION_LEN}</span>
    </div>
    <textarea
      id="group-description"
      bind:value={description}
      maxlength={MAX_GROUP_DESCRIPTION_LEN}
      rows="6"
      placeholder="群組在做什麼、伺服器 IP、加入條件……"
      class="{input} resize-y py-2 leading-relaxed"></textarea>
  </div>

  <!-- fieldset 預設 min-width: min-content，不加 min-w-0 會被內容撐出去 -->
  <fieldset class="flex min-w-0 flex-col gap-2">
    <legend class="{labelClass} mb-1.5 flex w-full items-baseline justify-between">
      社群連結<span class="text-xs font-normal text-cloud-600">{links.length} / {MAX_LINKS}</span>
    </legend>
    {#each links as link, i (link)}
      <!-- 桌面一行：圖示 | 類型 | 網址 | 顯示名稱 | 按鈕；手機分三行：圖示 類型 按鈕 / 網址 / 顯示名稱 -->
      <div
        class="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-cloud-200 bg-cloud-50 p-2 sm:grid-cols-[2rem_8rem_minmax(0,1fr)_10rem_auto]"
      >
        <span class="grid size-8 place-items-center text-cloud-700"
          ><LinkIcon type={link.type} /></span
        >
        <select bind:value={link.type} aria-label="連結類型" class="{input} h-9">
          {#each LINK_TYPES as t (t)}
            <option value={t}>{LINK_LABELS[t]}</option>
          {/each}
        </select>
        <input
          type="url"
          bind:value={link.url}
          onchange={() => guess(link)}
          required
          placeholder="https://"
          aria-label="網址"
          class="{input} col-span-3 h-9 sm:col-span-1"
        />
        <input
          bind:value={link.label}
          maxlength="50"
          placeholder="顯示名稱（選填）"
          aria-label="顯示名稱"
          class="{input} col-span-3 h-9 sm:col-span-1"
        />
        <div class="col-start-3 row-start-1 flex gap-0.5 sm:col-start-5">
          <button
            type="button"
            disabled={i === 0}
            onclick={() => move(i, -1)}
            class="rounded p-1.5 text-cloud-600 hover:bg-cloud-200 disabled:opacity-30"
            aria-label="上移"><ArrowUp class="size-4" /></button
          >
          <button
            type="button"
            disabled={i === links.length - 1}
            onclick={() => move(i, 1)}
            class="rounded p-1.5 text-cloud-600 hover:bg-cloud-200 disabled:opacity-30"
            aria-label="下移"><ArrowDown class="size-4" /></button
          >
          <button
            type="button"
            onclick={() => (links = links.filter((_, j) => j !== i))}
            class="rounded p-1.5 text-cloud-600 hover:bg-cloud-200"
            aria-label="移除"><Trash2 class="size-4" /></button
          >
        </div>
      </div>
    {/each}
    {#if links.length < MAX_LINKS}
      <button
        type="button"
        onclick={() => (links = [...links, { type: 'website', url: '', label: '' }])}
        class="flex h-9 w-fit items-center gap-1.5 rounded-md border border-dashed border-cloud-400 px-3 text-sm text-cloud-800 hover:border-cloud-600"
      >
        <Plus class="size-4" />新增連結
      </button>
    {/if}
    <p class="text-xs text-cloud-600">
      Discord 邀請、YouTube 頻道、網站等，只接受 http(s) 網址，會依照這裡的順序顯示。
    </p>
  </fieldset>
</div>
