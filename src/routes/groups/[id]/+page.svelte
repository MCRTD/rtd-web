<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { AlertDialog } from 'bits-ui';
  import {
    Check,
    ChevronRight,
    Crown,
    LoaderCircle,
    Lock,
    LogOut,
    Settings,
    Shield,
    UserPlus,
    X
  } from '@lucide/svelte';
  import { avatarUrl } from '#lib/api.js';
  import { errorMessage, request } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import { formatDate, formatNumber } from '#lib/format.js';
  import { LINK_LABELS, ROLE_LABELS, atLeast } from '#lib/groups.js';
  import BlueprintCard from '#lib/components/BlueprintCard.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import GroupAvatar from '#lib/components/GroupAvatar.svelte';
  import LinkIcon from '#lib/components/LinkIcon.svelte';
  import Pager from '#lib/components/Pager.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const group = $derived(data.group);
  const role = $derived(group.viewer_role);
  const invite = $derived(group.viewer_invite);
  const isAdmin = $derived(atLeast(role, 'admin'));
  const kindName = $derived(
    (page.data.groupKinds ?? []).find((k) => k.slug === group.kind)?.name ?? group.kind
  );
  const loginHref = $derived(`/login?next=${encodeURIComponent(page.url.pathname)}`);

  let busy = $state<string | null>(null);
  let message = $state<string | null>(null);
  let leaveOpen = $state(false);

  async function act(label: string, action: () => Promise<unknown>) {
    busy = label;
    message = null;
    try {
      await action();
      await invalidateAll();
    } catch (e) {
      message = errorMessage(e);
    } finally {
      busy = null;
    }
  }

  // 有邀請時 join 就是接受邀請。
  const join = () => act('join', () => request('POST', `/groups/${group.id}/join`));
  const decline = () => act('decline', () => request('POST', `/invites/${invite!.id}/decline`));
  const leave = () =>
    act('leave', async () => {
      leaveOpen = false;
      await request('DELETE', `/groups/${group.id}/members/${data.user!.uuid}`);
    });
  const removeBlueprint = (id: string) =>
    act(`bp:${id}`, () => request('DELETE', `/groups/${group.id}/blueprints/${id}`));

  const tabHref = (tab: string, p = 1) => {
    const params = new URLSearchParams();
    if (tab !== 'blueprints') params.set('tab', tab);
    if (p > 1) params.set('page', String(p));
    return `?${params}`;
  };

  const roleIcon = { owner: Crown, admin: Shield, member: null };

  const primary =
    'flex h-10 items-center justify-center gap-2 rounded-lg bg-cloud-600 px-4 text-sm font-bold text-white shadow-[0_3px_0_0_var(--color-cloud-800)] hover:bg-cloud-700 disabled:opacity-60';
  const secondary =
    'flex h-10 items-center justify-center gap-2 rounded-lg border border-cloud-300 bg-white px-4 text-sm font-medium text-cloud-800 hover:border-cloud-500 disabled:opacity-60';
</script>

<svelte:head>
  <title>{group.name} · {SITE_NAME}</title>
  <meta
    name="description"
    content={group.description.slice(0, 160) || `${kindName} · ${group.member_count} 位成員`}
  />
  {#if group.avatar_url}<meta property="og:image" content={group.avatar_url} />{/if}
</svelte:head>

<section class="border-b border-cloud-400 bg-cloud-300">
  <!-- 封面裁成 1920×480（4:1），照比例顯示才不會被切掉上下。 -->
  <div
    class="mx-auto aspect-[4/1] max-h-[480px] w-full max-w-[1920px] overflow-hidden bg-cloud-400"
  >
    {#if group.banner_url}<img src={group.banner_url} alt="" class="size-full object-cover" />{/if}
  </div>
  <div class="container-page flex flex-col gap-4 pb-6 sm:flex-row sm:items-end">
    <GroupAvatar
      url={group.avatar_url}
      name={group.name}
      class="relative z-10 -mt-12 size-24 border-4 border-cloud-50 text-4xl sm:-mt-14 sm:size-28"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <nav aria-label="導覽路徑" class="flex items-center gap-1 text-sm text-cloud-700">
        <a href="/groups" class="hover:text-cloud-950 hover:underline">群組</a>
        <ChevronRight class="size-3.5" />
        <a href="/groups?kind={group.kind}" class="hover:text-cloud-950 hover:underline"
          >{kindName}</a
        >
      </nav>
      <h1 class="text-3xl font-bold break-words text-cloud-950">{group.name}</h1>
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cloud-800">
        <span>{formatNumber(group.member_count)} 位成員</span>
        <span>{formatNumber(group.blueprint_count)} 個藍圖</span>
        <span class="inline-flex items-center gap-1">
          {#if group.join_policy === 'invite'}<Lock class="size-3.5" />邀請制{:else}公開加入{/if}
        </span>
        <span>{formatDate(group.created_at)} 建立</span>
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      {#if !data.user}
        {#if group.join_policy === 'open'}<a href={loginHref} class={primary}>登入後加入</a>{/if}
      {:else if invite}
        <button type="button" onclick={join} disabled={!!busy} class={primary}>
          {#if busy === 'join'}<LoaderCircle class="size-4 animate-spin" />{:else}<Check
              class="size-4"
            />{/if}
          接受邀請（{ROLE_LABELS[invite.role]}）
        </button>
        <button type="button" onclick={decline} disabled={!!busy} class={secondary}>
          {#if busy === 'decline'}<LoaderCircle class="size-4 animate-spin" />{:else}<X
              class="size-4"
            />{/if}拒絕
        </button>
      {:else if !role && group.join_policy === 'open'}
        <button type="button" onclick={join} disabled={!!busy} class={primary}>
          {#if busy === 'join'}<LoaderCircle class="size-4 animate-spin" />{:else}<UserPlus
              class="size-4"
            />{/if}加入群組
        </button>
      {/if}
      {#if isAdmin}
        <a href="/groups/{group.id}/settings" class={secondary}
          ><Settings class="size-4" />管理群組</a
        >
      {/if}
      {#if role && role !== 'owner'}
        <button
          type="button"
          onclick={() => (leaveOpen = true)}
          disabled={!!busy}
          class={secondary}
        >
          <LogOut class="size-4" />退出
        </button>
      {/if}
    </div>
  </div>
  {#if message}<p class="container-page pb-4 text-sm text-red-700" role="alert">{message}</p>{/if}
</section>

<div class="container-page grid gap-8 py-8 lg:grid-cols-[1fr_18rem]">
  <div class="flex min-w-0 flex-col gap-6">
    <nav class="flex w-fit gap-1 rounded-lg bg-cloud-200 p-1" aria-label="分頁">
      {#each [['blueprints', `藍圖（${group.blueprint_count}）`], ['members', `成員（${group.member_count}）`]] as [id, label] (id)}
        <a
          href={tabHref(id)}
          aria-current={data.tab === id ? 'page' : undefined}
          class="rounded-md px-4 py-1.5 text-sm font-medium text-cloud-700 hover:text-cloud-950 aria-[current=page]:bg-white aria-[current=page]:text-cloud-950 aria-[current=page]:shadow-sm"
        >
          {label}
        </a>
      {/each}
    </nav>

    {#if data.blueprints}
      {#if data.blueprints.items.length}
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {#each data.blueprints.items as bp (bp.id)}
            <div class="relative">
              <BlueprintCard blueprint={bp} />
              {#if isAdmin || bp.owner.uuid === data.user?.uuid}
                <button
                  type="button"
                  onclick={() => removeBlueprint(bp.id)}
                  disabled={!!busy}
                  class="absolute top-2 right-2 z-20 rounded-md bg-white/90 p-1.5 text-cloud-700 shadow hover:text-red-700"
                  title="移出群組"
                  aria-label="把 {bp.name} 移出群組"
                >
                  {#if busy === `bp:${bp.id}`}<LoaderCircle class="size-4 animate-spin" />{:else}<X
                      class="size-4"
                    />{/if}
                </button>
              {/if}
            </div>
          {/each}
        </div>
        <Pager
          count={data.blueprints.total}
          perPage={data.blueprints.per_page}
          page={data.blueprints.page}
          href={(p) => tabHref('blueprints', p)}
        />
      {:else}
        <EmptyState title="這個群組還沒有藍圖">
          {#if role}到藍圖頁面按「加入群組」就能把藍圖放進來。{/if}
        </EmptyState>
      {/if}
    {:else if data.members}
      <ul class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {#each data.members.items as member (member.uuid)}
          {@const Icon = roleIcon[member.role]}
          <li>
            <a
              href="/users/{member.uuid}"
              class="flex items-center gap-3 rounded-lg border border-cloud-300 bg-white p-3 hover:border-cloud-500"
            >
              <img
                src={avatarUrl(member.uuid, 40)}
                alt=""
                class="size-10 rounded [image-rendering:pixelated]"
              />
              <span class="flex min-w-0 flex-col">
                <span class="truncate font-medium text-cloud-950">{member.username}</span>
                <span class="inline-flex items-center gap-1 text-xs text-cloud-600">
                  {#if Icon}<Icon class="size-3.5" />{/if}{ROLE_LABELS[member.role]} · {formatDate(
                    member.joined_at
                  )} 加入
                </span>
              </span>
            </a>
          </li>
        {/each}
      </ul>
      <Pager
        count={data.members.total}
        perPage={data.members.per_page}
        page={data.members.page}
        href={(p) => tabHref('members', p)}
      />
    {/if}
  </div>

  <aside class="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
    <section class="rounded-lg border border-cloud-300 bg-white p-5">
      <h2 class="mb-2 font-bold text-cloud-900">簡介</h2>
      {#if group.description.trim()}
        <p class="leading-relaxed break-words whitespace-pre-line text-cloud-900">
          {group.description}
        </p>
      {:else}
        <p class="text-sm text-cloud-600">這個群組還沒有簡介。</p>
      {/if}
    </section>

    {#if group.links.length}
      <section class="rounded-lg border border-cloud-300 bg-white p-5">
        <h2 class="mb-2 font-bold text-cloud-900">社群連結</h2>
        <ul class="flex flex-col gap-1">
          {#each group.links as link, i (i)}
            <li>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-cloud-900 hover:bg-cloud-50"
              >
                <LinkIcon type={link.type} class="size-4 shrink-0 text-cloud-600" />
                <span class="min-w-0 flex-1 truncate"
                  >{link.label || LINK_LABELS[link.type] || link.url}</span
                >
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="rounded-lg border border-cloud-300 bg-white p-5 text-sm">
      <h2 class="mb-2 font-bold text-cloud-900">擁有者</h2>
      <a
        href="/users/{group.owner.uuid}"
        class="flex items-center gap-2 text-cloud-900 hover:underline"
      >
        <img
          src={avatarUrl(group.owner.uuid, 32)}
          alt=""
          class="size-6 rounded [image-rendering:pixelated]"
        />
        {group.owner.username}
      </a>
    </section>
  </aside>
</div>

<AlertDialog.Root bind:open={leaveOpen}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="fixed inset-0 z-50 bg-cloud-950/50" />
    <AlertDialog.Content
      class="fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-1/2 rounded-lg bg-white p-6 shadow-xl"
    >
      <AlertDialog.Title class="text-lg font-bold text-cloud-950"
        >退出「{group.name}」？</AlertDialog.Title
      >
      <AlertDialog.Description class="mt-2 text-sm text-cloud-700">
        {group.join_policy === 'invite'
          ? '這是邀請制群組，退出後要再被邀請才能加入。'
          : '之後可以再自行加入。'}你加入群組的藍圖不會被移除。
      </AlertDialog.Description>
      <div class="mt-5 flex justify-end gap-2">
        <AlertDialog.Cancel class={secondary}>取消</AlertDialog.Cancel>
        <AlertDialog.Action
          onclick={leave}
          class="flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700"
          >退出群組</AlertDialog.Action
        >
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
