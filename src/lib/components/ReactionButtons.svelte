<script lang="ts">
  import { page } from '$app/state';
  import { Bookmark, Heart } from '@lucide/svelte';
  import type { Blueprint } from '#lib/api.js';
  import { errorMessage, request } from '#lib/client.js';
  import { formatCompact } from '#lib/format.js';

  let { blueprint }: { blueprint: Blueprint } = $props();

  type Reaction = { active: boolean; count: number };

  // 先更新畫面，失敗再改回來。
  let liked = $derived(blueprint.viewer?.liked ?? false);
  let likes = $derived(blueprint.like_count);
  let favorited = $derived(blueprint.viewer?.favorited ?? false);
  let favorites = $derived(blueprint.favorite_count);
  let busy = $state<'like' | 'favorite' | null>(null);
  let message = $state<string | null>(null);

  const user = $derived(page.data.user);
  const mine = $derived(user?.uuid === blueprint.owner.uuid);
  const loginHref = $derived(`/login?next=${encodeURIComponent(page.url.pathname)}`);

  async function toggle(kind: 'like' | 'favorite') {
    if (busy) return;
    busy = kind;
    message = null;
    const on = kind === 'like' ? !liked : !favorited;
    const before =
      kind === 'like' ? { active: liked, count: likes } : { active: favorited, count: favorites };
    apply(kind, { active: on, count: before.count + (on ? 1 : -1) });
    try {
      apply(
        kind,
        await request<Reaction>(on ? 'PUT' : 'DELETE', `/blueprints/${blueprint.id}/${kind}`)
      );
    } catch (e) {
      apply(kind, before);
      message = errorMessage(e);
    } finally {
      busy = null;
    }
  }

  function apply(kind: 'like' | 'favorite', r: Reaction) {
    if (kind === 'like') {
      liked = r.active;
      likes = r.count;
    } else {
      favorited = r.active;
      favorites = r.count;
    }
  }

  const base =
    'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60';
  const off = 'border-cloud-300 text-cloud-800 hover:border-cloud-500 hover:bg-cloud-50';
</script>

<div class="flex flex-col gap-1.5">
  <div class="flex gap-2">
    {#if user}
      <button
        type="button"
        onclick={() => toggle('like')}
        disabled={busy === 'like' || mine}
        aria-pressed={liked}
        title={mine ? '不能對自己的藍圖點讚' : liked ? '取消讚' : '讚'}
        class="{base} {liked ? 'border-rose-300 bg-rose-50 text-rose-700' : off}"
      >
        <Heart class="size-4 {liked ? 'fill-current' : ''}" />{formatCompact(likes)}
      </button>
      <button
        type="button"
        onclick={() => toggle('favorite')}
        disabled={busy === 'favorite'}
        aria-pressed={favorited}
        title={favorited ? '取消收藏' : '收藏'}
        class="{base} {favorited ? 'border-amber-300 bg-amber-50 text-amber-700' : off}"
      >
        <Bookmark class="size-4 {favorited ? 'fill-current' : ''}" />{favorited ? '已收藏' : '收藏'} ·
        {formatCompact(favorites)}
      </button>
    {:else}
      <a href={loginHref} class="{base} {off}" title="登入後才能點讚">
        <Heart class="size-4" />{formatCompact(likes)}
      </a>
      <a href={loginHref} class="{base} {off}" title="登入後才能收藏">
        <Bookmark class="size-4" />收藏 · {formatCompact(favorites)}
      </a>
    {/if}
  </div>
  {#if message}<p class="text-center text-xs text-red-700" role="alert">{message}</p>{/if}
</div>
