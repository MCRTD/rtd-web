<script lang="ts">
  import { untrack } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { AlertDialog } from 'bits-ui';
  import {
    Camera,
    Check,
    ChevronRight,
    ImagePlus,
    LoaderCircle,
    Save,
    Search,
    Trash2,
    UserPlus,
    X
  } from '@lucide/svelte';
  import { avatarUrl, type GroupLink, type GroupRole } from '#lib/api.js';
  import { IMAGE_TYPES, MAX_IMAGE_BYTES, errorMessage, request } from '#lib/client.js';
  import { SITE_NAME } from '#lib/config.js';
  import { formatRelative } from '#lib/format.js';
  import { ROLE_LABELS, atLeast, outranks } from '#lib/groups.js';
  import GroupAvatar from '#lib/components/GroupAvatar.svelte';
  import GroupFields from '#lib/components/GroupFields.svelte';
  import ImageCropper from '#lib/components/ImageCropper.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const group = $derived(data.group);
  const myRole = $derived(group.viewer_role!);
  const isOwner = $derived(myRole === 'owner');

  // ---- 基本資料 ----
  type Fields = {
    name: string;
    kind: string;
    joinPolicy: 'open' | 'invite';
    description: string;
    links: GroupLink[];
  };
  const fieldsOf = (g: typeof group): Fields => ({
    name: g.name,
    kind: g.kind,
    joinPolicy: g.join_policy,
    description: g.description,
    links: g.links.map((l) => ({ ...l, label: l.label ?? '' }))
  });
  let fields = $state(untrack(() => fieldsOf(data.group)));
  const cleanLinks = (links: GroupLink[]) =>
    links.map((l) => ({
      type: l.type,
      url: l.url.trim(),
      ...(l.label?.trim() ? { label: l.label.trim() } : {})
    }));
  const dirty = $derived(
    JSON.stringify({ ...fields, name: fields.name.trim(), links: cleanLinks(fields.links) }) !==
      JSON.stringify({ ...fieldsOf(group), links: cleanLinks(fieldsOf(group).links) })
  );
  let saving = $state(false);
  let savedAt = $state(false);
  let infoMessage = $state<string | null>(null);

  async function saveInfo(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    infoMessage = null;
    try {
      await request('PATCH', `/groups/${group.id}`, {
        name: fields.name.trim(),
        kind: fields.kind,
        join_policy: fields.joinPolicy,
        description: fields.description,
        links: cleanLinks(fields.links)
      });
      await invalidateAll();
      fields = fieldsOf(data.group);
      savedAt = true;
      setTimeout(() => (savedAt = false), 2000);
    } catch (err) {
      infoMessage = errorMessage(err);
    } finally {
      saving = false;
    }
  }

  // ---- 頭像與封面 ----
  type Slot = 'avatar' | 'banner';
  const SLOTS = {
    avatar: { title: '裁切頭像', aspect: 1, width: 512, height: 512, round: true },
    banner: { title: '裁切封面橫幅', aspect: 4, width: 1920, height: 480, round: false }
  };
  let cropping = $state<{ slot: Slot; file: File } | null>(null);
  let imageBusy = $state<Slot | null>(null);
  let imageMessage = $state<string | null>(null);

  function pick(slot: Slot, input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    imageMessage = null;
    if (!IMAGE_TYPES.includes(file.type)) {
      imageMessage = '只接受 PNG、JPEG 或 WebP。';
      return;
    }
    cropping = { slot, file };
  }

  async function upload(slot: Slot, blob: Blob) {
    if (blob.size > MAX_IMAGE_BYTES) {
      imageMessage = '裁切後的圖片超過 10 MB。';
      return;
    }
    imageBusy = slot;
    try {
      const form = new FormData();
      form.append('image', blob, `${slot}.${blob.type === 'image/jpeg' ? 'jpg' : 'png'}`);
      await request('PUT', `/groups/${group.id}/${slot}`, form);
      cropping = null;
      await invalidateAll();
    } catch (err) {
      imageMessage = errorMessage(err);
    } finally {
      imageBusy = null;
    }
  }

  async function clearImage(slot: Slot) {
    imageBusy = slot;
    imageMessage = null;
    try {
      await request('DELETE', `/groups/${group.id}/${slot}`);
      await invalidateAll();
    } catch (err) {
      imageMessage = errorMessage(err);
    } finally {
      imageBusy = null;
    }
  }

  // ---- 邀請 ----
  let search = $state('');
  let results = $state<{ uuid: string; username: string }[]>([]);
  let searching = $state(false);
  let inviteRole = $state<'member' | 'admin'>('member');
  let inviteBusy = $state<string | null>(null);
  let inviteMessage = $state<string | null>(null);
  let inviteDone = $state<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let seq = 0;

  const memberIds = $derived(new Set(data.members.items.map((m) => m.uuid)));
  const invitedIds = $derived(new Set(data.invites.items.map((i) => i.user.uuid)));

  function searchSoon() {
    clearTimeout(timer);
    const q = search.trim();
    if (!q) {
      results = [];
      return;
    }
    timer = setTimeout(async () => {
      const mine = ++seq;
      searching = true;
      try {
        const found = await request<{ uuid: string; username: string }[]>(
          'GET',
          `/users?q=${encodeURIComponent(q)}`
        );
        if (mine === seq) results = found;
      } catch {
      } finally {
        if (mine === seq) searching = false;
      }
    }, 250);
  }

  async function invite(user: { uuid: string; username: string }) {
    inviteBusy = user.uuid;
    inviteMessage = null;
    inviteDone = null;
    try {
      await request('POST', `/groups/${group.id}/invites`, { uuid: user.uuid, role: inviteRole });
      inviteDone = `已邀請 ${user.username}，對方接受後就會加入。`;
      search = '';
      results = [];
      await invalidateAll();
    } catch (err) {
      inviteMessage = errorMessage(err);
    } finally {
      inviteBusy = null;
    }
  }

  async function cancelInvite(id: string) {
    inviteBusy = id;
    inviteMessage = null;
    try {
      await request('DELETE', `/groups/${group.id}/invites/${id}`);
      await invalidateAll();
    } catch (err) {
      inviteMessage = errorMessage(err);
    } finally {
      inviteBusy = null;
    }
  }

  // ---- 成員 ----
  let memberBusy = $state<string | null>(null);
  let memberMessage = $state<string | null>(null);
  let transferTo = $state<{ uuid: string; username: string } | null>(null);

  async function memberAction(uuid: string, action: () => Promise<unknown>) {
    memberBusy = uuid;
    memberMessage = null;
    try {
      await action();
      await invalidateAll();
    } catch (err) {
      memberMessage = errorMessage(err);
    } finally {
      memberBusy = null;
    }
  }

  const setRole = (uuid: string, role: GroupRole) =>
    memberAction(uuid, () => request('PATCH', `/groups/${group.id}/members/${uuid}`, { role }));
  const removeMember = (uuid: string) =>
    memberAction(uuid, () => request('DELETE', `/groups/${group.id}/members/${uuid}`));

  async function transfer() {
    const target = transferTo!;
    transferTo = null;
    await setRole(target.uuid, 'owner');
    // 轉移後自己變成管理員，仍然可以留在這頁。
  }

  // ---- 刪除 ----
  let deleteOpen = $state(false);
  let confirmName = $state('');
  let deleting = $state(false);
  let deleteMessage = $state<string | null>(null);

  async function remove() {
    deleting = true;
    deleteMessage = null;
    try {
      await request('DELETE', `/groups/${group.id}`);
      goto('/groups');
    } catch (err) {
      deleteMessage = errorMessage(err);
      deleting = false;
    }
  }

  const card = 'flex flex-col gap-4 rounded-lg border border-cloud-300 bg-white p-6';
  const h2 = 'text-lg font-bold text-cloud-950';
  const primary =
    'flex h-10 items-center justify-center gap-2 rounded-lg bg-cloud-600 px-4 text-sm font-bold text-white hover:bg-cloud-700 disabled:opacity-60';
  const secondary =
    'flex h-9 items-center justify-center gap-1.5 rounded-md border border-cloud-300 bg-white px-3 text-sm font-medium text-cloud-800 hover:border-cloud-500 disabled:opacity-60';
</script>

<svelte:head>
  <title>管理群組 · {group.name} · {SITE_NAME}</title>
</svelte:head>

<div class="container-page flex max-w-4xl flex-col gap-6 py-8">
  <nav aria-label="導覽路徑" class="flex items-center gap-1 text-sm text-cloud-600">
    <a href="/groups" class="hover:text-cloud-900 hover:underline">群組</a>
    <ChevronRight class="size-3.5" />
    <a href="/groups/{group.id}" class="line-clamp-1 hover:text-cloud-900 hover:underline"
      >{group.name}</a
    >
    <ChevronRight class="size-3.5" />
    <span class="text-cloud-900">管理</span>
  </nav>

  {#if data.created}
    <p
      class="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      群組建立好了！接下來可以上傳頭像與封面、邀請成員。
    </p>
  {/if}

  <!-- 頭像與封面 -->
  <section class={card}>
    <h2 class={h2}>頭像與封面</h2>
    <div class="overflow-hidden rounded-lg border border-cloud-200">
      <div class="relative aspect-[4/1] bg-cloud-300">
        {#if group.banner_url}<img
            src={group.banner_url}
            alt="封面橫幅"
            class="size-full object-cover"
          />{/if}
        <div class="absolute right-2 bottom-2 flex gap-2">
          <label class="{secondary} cursor-pointer">
            {#if imageBusy === 'banner'}<LoaderCircle
                class="size-4 animate-spin"
              />{:else}<ImagePlus class="size-4" />{/if}
            {group.banner_url ? '更換封面' : '上傳封面'}
            <input
              type="file"
              accept={IMAGE_TYPES.join(',')}
              class="sr-only"
              disabled={!!imageBusy}
              onchange={(e) => pick('banner', e.currentTarget)}
            />
          </label>
          {#if group.banner_url}
            <button
              type="button"
              class={secondary}
              disabled={!!imageBusy}
              onclick={() => clearImage('banner')}
              aria-label="移除封面"><Trash2 class="size-4" /></button
            >
          {/if}
        </div>
      </div>
      <div class="flex items-center gap-4 p-4">
        <GroupAvatar url={group.avatar_url} name={group.name} class="size-20 text-3xl" />
        <div class="flex flex-wrap gap-2">
          <label class="{secondary} cursor-pointer">
            {#if imageBusy === 'avatar'}<LoaderCircle class="size-4 animate-spin" />{:else}<Camera
                class="size-4"
              />{/if}
            {group.avatar_url ? '更換頭像' : '上傳頭像'}
            <input
              type="file"
              accept={IMAGE_TYPES.join(',')}
              class="sr-only"
              disabled={!!imageBusy}
              onchange={(e) => pick('avatar', e.currentTarget)}
            />
          </label>
          {#if group.avatar_url}
            <button
              type="button"
              class={secondary}
              disabled={!!imageBusy}
              onclick={() => clearImage('avatar')}><Trash2 class="size-4" />移除</button
            >
          {/if}
        </div>
      </div>
    </div>
    <p class="text-xs text-cloud-600">
      PNG、JPEG 或 WebP。上傳前可以裁切：頭像為正方形，封面為 4:1。透明背景會保留。
    </p>
    {#if imageMessage}<p class="text-sm text-red-700" role="alert">{imageMessage}</p>{/if}
  </section>

  <!-- 基本資料 -->
  <form class={card} onsubmit={saveInfo}>
    <h2 class={h2}>基本資料</h2>
    <GroupFields
      bind:name={fields.name}
      bind:kind={fields.kind}
      bind:joinPolicy={fields.joinPolicy}
      bind:description={fields.description}
      bind:links={fields.links}
    />
    {#if infoMessage}<p class="text-sm text-red-700" role="alert">{infoMessage}</p>{/if}
    <div class="flex items-center justify-end gap-3">
      {#if savedAt}<span class="flex items-center gap-1 text-sm text-emerald-700"
          ><Check class="size-4" />已儲存</span
        >{/if}
      <button type="submit" class={primary} disabled={saving || !dirty || !fields.name.trim()}>
        {#if saving}<LoaderCircle class="size-4 animate-spin" />{:else}<Save
            class="size-4"
          />{/if}儲存變更
      </button>
    </div>
  </form>

  <!-- 邀請 -->
  <section class={card}>
    <h2 class={h2}>邀請成員</h2>
    <div class="flex flex-wrap gap-2">
      <label class="relative min-w-48 flex-1">
        <span class="sr-only">玩家名稱</span>
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cloud-500"
        />
        <input
          type="search"
          bind:value={search}
          oninput={searchSoon}
          placeholder="輸入玩家名稱"
          autocomplete="off"
          class="h-10 w-full rounded-md border border-cloud-300 pr-3 pl-9 text-sm focus:border-cloud-600 focus:outline-none"
        />
      </label>
      <select
        bind:value={inviteRole}
        aria-label="邀請的角色"
        class="h-10 rounded-md border border-cloud-300 bg-white px-2 text-sm focus:border-cloud-600 focus:outline-none"
      >
        <option value="member">成員</option>
        {#if isOwner}<option value="admin">管理員</option>{/if}
      </select>
    </div>
    {#if search.trim()}
      <ul class="divide-y divide-cloud-100 rounded-md border border-cloud-200">
        {#each results as user (user.uuid)}
          {@const status = memberIds.has(user.uuid)
            ? '已是成員'
            : invitedIds.has(user.uuid)
              ? '已邀請'
              : null}
          <li class="flex items-center gap-3 px-3 py-2">
            <img
              src={avatarUrl(user.uuid, 32)}
              alt=""
              class="size-7 rounded [image-rendering:pixelated]"
            />
            <span class="flex-1 font-medium text-cloud-950">{user.username}</span>
            {#if status}
              <span class="text-xs text-cloud-600">{status}</span>
            {:else}
              <button
                type="button"
                class={secondary}
                disabled={!!inviteBusy}
                onclick={() => invite(user)}
              >
                {#if inviteBusy === user.uuid}<LoaderCircle
                    class="size-4 animate-spin"
                  />{:else}<UserPlus class="size-4" />{/if}邀請
              </button>
            {/if}
          </li>
        {:else}
          <li class="px-3 py-3 text-sm text-cloud-600">
            {searching ? '搜尋中…' : '找不到這位玩家。對方要先登入過 MC RTD 一次才能被邀請。'}
          </li>
        {/each}
      </ul>
    {/if}
    {#if inviteDone}<p class="text-sm text-emerald-700">{inviteDone}</p>{/if}
    {#if inviteMessage}<p class="text-sm text-red-700" role="alert">{inviteMessage}</p>{/if}

    {#if data.invites.items.length}
      <div class="flex flex-col gap-2">
        <h3 class="text-sm font-bold text-cloud-900">等待回覆（{data.invites.total}）</h3>
        <ul class="divide-y divide-cloud-100 rounded-md border border-cloud-200">
          {#each data.invites.items as inv (inv.id)}
            <li class="flex items-center gap-3 px-3 py-2 text-sm">
              <img
                src={avatarUrl(inv.user.uuid, 32)}
                alt=""
                class="size-7 rounded [image-rendering:pixelated]"
              />
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="font-medium text-cloud-950">{inv.user.username}</span>
                <span class="text-xs text-cloud-600">
                  {ROLE_LABELS[inv.role]} · {inv.invited_by
                    ? `${inv.invited_by.username} `
                    : ''}{formatRelative(inv.created_at)}邀請
                </span>
              </span>
              <button
                type="button"
                class={secondary}
                disabled={!!inviteBusy}
                onclick={() => cancelInvite(inv.id)}
              >
                {#if inviteBusy === inv.id}<LoaderCircle class="size-4 animate-spin" />{:else}<X
                    class="size-4"
                  />{/if}取消邀請
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>

  <!-- 成員 -->
  <section class={card}>
    <h2 class={h2}>成員（{data.members.total}）</h2>
    <ul class="divide-y divide-cloud-100 rounded-md border border-cloud-200">
      {#each data.members.items as member (member.uuid)}
        {@const me = member.uuid === data.user?.uuid}
        {@const canRemove = !me && member.role !== 'owner' && outranks(myRole, member.role)}
        <li class="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
          <img
            src={avatarUrl(member.uuid, 32)}
            alt=""
            class="size-7 rounded [image-rendering:pixelated]"
          />
          <a
            href="/users/{member.uuid}"
            class="min-w-0 flex-1 font-medium text-cloud-950 hover:underline"
          >
            {member.username}{#if me}<span class="ml-1 text-xs font-normal text-cloud-600"
                >（你）</span
              >{/if}
          </a>
          {#if isOwner && !me}
            <select
              value={member.role}
              disabled={!!memberBusy}
              aria-label="{member.username} 的角色"
              onchange={(e) => {
                const role = e.currentTarget.value as GroupRole;
                if (role === 'owner') {
                  e.currentTarget.value = member.role;
                  transferTo = member;
                } else setRole(member.uuid, role);
              }}
              class="h-9 rounded-md border border-cloud-300 bg-white px-2 text-sm"
            >
              <option value="member">成員</option>
              <option value="admin">管理員</option>
              <option value="owner">擁有者（轉移）</option>
            </select>
          {:else}
            <span class="text-xs text-cloud-600">{ROLE_LABELS[member.role]}</span>
          {/if}
          {#if canRemove}
            <button
              type="button"
              class={secondary}
              disabled={!!memberBusy}
              onclick={() => removeMember(member.uuid)}
              aria-label="移除 {member.username}"
            >
              {#if memberBusy === member.uuid}<LoaderCircle class="size-4 animate-spin" />{:else}<X
                  class="size-4"
                />{/if}移除
            </button>
          {/if}
        </li>
      {/each}
    </ul>
    {#if data.members.total > data.members.items.length}
      <p class="text-xs text-cloud-600">只列出前 {data.members.items.length} 位成員。</p>
    {/if}
    {#if memberMessage}<p class="text-sm text-red-700" role="alert">{memberMessage}</p>{/if}
    {#if !atLeast(myRole, 'owner')}
      <p class="text-xs text-cloud-600">
        管理員可以移除一般成員；變更角色與轉移群組只有擁有者可以。
      </p>
    {/if}
  </section>

  {#if isOwner}
    <section class="{card} border-red-200">
      <h2 class="{h2} text-red-800">刪除群組</h2>
      <p class="text-sm text-cloud-800">
        群組、成員名單與邀請都會刪除，群組裡的藍圖本身不受影響。這個動作無法復原。
      </p>
      <button
        type="button"
        onclick={() => {
          confirmName = '';
          deleteOpen = true;
        }}
        class="flex h-10 w-fit items-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-bold text-red-700 hover:bg-red-50"
      >
        <Trash2 class="size-4" />刪除群組
      </button>
    </section>
  {/if}
</div>

{#if cropping}
  {@const spec = SLOTS[cropping.slot]}
  {@const slot = cropping.slot}
  <ImageCropper
    file={cropping.file}
    {...spec}
    onconfirm={(blob) => upload(slot, blob)}
    oncancel={() => (cropping = null)}
  />
{/if}

<AlertDialog.Root open={!!transferTo} onOpenChange={(open) => !open && (transferTo = null)}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="fixed inset-0 z-50 bg-cloud-950/50" />
    <AlertDialog.Content
      class="fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-1/2 rounded-lg bg-white p-6 shadow-xl"
    >
      <AlertDialog.Title class="text-lg font-bold text-cloud-950"
        >把群組轉移給 {transferTo?.username}？</AlertDialog.Title
      >
      <AlertDialog.Description class="mt-2 text-sm text-cloud-700">
        對方會成為擁有者，你會變成管理員，之後就不能再變更角色或刪除群組。
      </AlertDialog.Description>
      <div class="mt-5 flex justify-end gap-2">
        <AlertDialog.Cancel class={secondary}>取消</AlertDialog.Cancel>
        <AlertDialog.Action onclick={transfer} class={primary}>轉移</AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>

<AlertDialog.Root bind:open={deleteOpen}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="fixed inset-0 z-50 bg-cloud-950/50" />
    <AlertDialog.Content
      class="fixed top-1/2 left-1/2 z-50 flex w-[min(28rem,calc(100vw-2rem))] -translate-1/2 flex-col gap-3 rounded-lg bg-white p-6 shadow-xl"
    >
      <AlertDialog.Title class="text-lg font-bold text-cloud-950"
        >刪除「{group.name}」？</AlertDialog.Title
      >
      <AlertDialog.Description class="text-sm text-cloud-700"
        >請輸入群組名稱確認。</AlertDialog.Description
      >
      <input
        bind:value={confirmName}
        aria-label="群組名稱"
        class="h-10 rounded-md border border-cloud-300 px-3 text-sm focus:border-red-500 focus:outline-none"
      />
      {#if deleteMessage}<p class="text-sm text-red-700" role="alert">{deleteMessage}</p>{/if}
      <div class="mt-2 flex justify-end gap-2">
        <AlertDialog.Cancel class={secondary}>取消</AlertDialog.Cancel>
        <button
          type="button"
          onclick={remove}
          disabled={deleting || confirmName.trim() !== group.name}
          class="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {#if deleting}<LoaderCircle class="size-4 animate-spin" />{/if}刪除群組
        </button>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
