<script lang="ts">
  import { LoaderCircle, Search, UserPlus, X } from '@lucide/svelte';
  import { avatarUrl, type Blueprint } from '#lib/api.js';
  import { MAX_AUTHORS, errorMessage, request } from '#lib/client.js';

  let { blueprint, onchange }: { blueprint: Blueprint; onchange: (b: Blueprint) => void } =
    $props();

  type Person = { uuid: string; username: string };

  let search = $state('');
  let results = $state<Person[]>([]);
  let searching = $state(false);
  let busy = $state<string | null>(null);
  let message = $state<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let seq = 0;

  const credited = $derived(
    new Set([blueprint.owner.uuid, ...blueprint.authors.map((a) => a.uuid)])
  );
  const full = $derived(blueprint.authors.length >= MAX_AUTHORS);

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
        const found = await request<Person[]>('GET', `/users?q=${encodeURIComponent(q)}`);
        if (mine === seq) results = found;
      } catch {
      } finally {
        if (mine === seq) searching = false;
      }
    }, 250);
  }

  async function run(uuid: string, method: 'PUT' | 'DELETE') {
    busy = uuid;
    message = null;
    try {
      const updated = await request<Blueprint>(
        method,
        `/blueprints/${blueprint.id}/authors/${uuid}`
      );
      onchange(updated);
      if (method === 'PUT') {
        search = '';
        results = [];
      }
    } catch (e) {
      message = errorMessage(e);
    } finally {
      busy = null;
    }
  }

  const button =
    'flex h-8 items-center justify-center gap-1.5 rounded-md border border-cloud-300 bg-white px-2.5 text-xs font-medium text-cloud-800 transition-colors hover:border-cloud-500 hover:bg-cloud-50 disabled:cursor-not-allowed disabled:opacity-50';
</script>

<div class="flex flex-col gap-3">
  <ul class="divide-y divide-cloud-100 rounded-md border border-cloud-200">
    <li class="flex items-center gap-3 px-3 py-2">
      <img
        src={avatarUrl(blueprint.owner.uuid, 32)}
        alt=""
        class="size-7 rounded [image-rendering:pixelated]"
      />
      <span class="flex-1 font-medium text-cloud-950">{blueprint.owner.username}</span>
      <span class="text-xs text-cloud-600">上傳者</span>
    </li>
    {#each blueprint.authors as author (author.uuid)}
      <li class="flex items-center gap-3 px-3 py-2">
        <img
          src={avatarUrl(author.uuid, 32)}
          alt=""
          class="size-7 rounded [image-rendering:pixelated]"
        />
        <a href="/users/{author.uuid}" class="flex-1 font-medium text-cloud-950 hover:underline"
          >{author.username}</a
        >
        <button
          type="button"
          class={button}
          disabled={!!busy}
          onclick={() => run(author.uuid, 'DELETE')}
          aria-label="移除 {author.username}"
        >
          {#if busy === author.uuid}<LoaderCircle class="size-3.5 animate-spin" />{:else}<X
              class="size-3.5"
            />{/if}移除
        </button>
      </li>
    {/each}
  </ul>

  {#if full}
    <p class="text-sm text-cloud-600">最多 {MAX_AUTHORS} 位共同作者。</p>
  {:else}
    <label class="relative">
      <span class="sr-only">玩家名稱</span>
      <Search
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cloud-500"
      />
      <input
        type="search"
        bind:value={search}
        oninput={searchSoon}
        placeholder="輸入玩家名稱加入共同作者"
        autocomplete="off"
        class="h-10 w-full rounded-md border border-cloud-300 pr-3 pl-9 text-sm focus:border-cloud-600 focus:outline-none"
      />
    </label>
    {#if search.trim()}
      <ul class="divide-y divide-cloud-100 rounded-md border border-cloud-200">
        {#each results as user (user.uuid)}
          <li class="flex items-center gap-3 px-3 py-2">
            <img
              src={avatarUrl(user.uuid, 32)}
              alt=""
              class="size-7 rounded [image-rendering:pixelated]"
            />
            <span class="flex-1 font-medium text-cloud-950">{user.username}</span>
            {#if credited.has(user.uuid)}
              <span class="text-xs text-cloud-600">
                {user.uuid === blueprint.owner.uuid ? '上傳者' : '已是共同作者'}
              </span>
            {:else}
              <button
                type="button"
                class={button}
                disabled={!!busy}
                onclick={() => run(user.uuid, 'PUT')}
              >
                {#if busy === user.uuid}<LoaderCircle
                    class="size-3.5 animate-spin"
                  />{:else}<UserPlus class="size-3.5" />{/if}加入
              </button>
            {/if}
          </li>
        {:else}
          <li class="px-3 py-3 text-sm text-cloud-600">
            {searching ? '搜尋中…' : '找不到這位玩家。對方要先登入過 MC RTD 一次才能被加入。'}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
  {#if message}<p class="text-sm text-red-700" role="alert">{message}</p>{/if}
</div>
