<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Search, Upload } from '@lucide/svelte';
  import { SITE_NAME } from '#lib/config.js';
  import NotificationBell from './NotificationBell.svelte';
  import UserMenu from './UserMenu.svelte';

  let query = $state(page.url.searchParams.get('q') ?? '');

  $effect(() => {
    query = page.url.pathname === '/blueprints' ? (page.url.searchParams.get('q') ?? '') : '';
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    goto(`/blueprints${params.size ? `?${params}` : ''}`);
  }

  const links = [
    { href: '/blueprints', label: '瀏覽藍圖' },
    { href: '/groups', label: '群組' },
    { href: '/tools', label: '工具' }
  ];
</script>

<header class="sticky top-0 z-30 border-b border-cloud-700 bg-cloud-600 text-cloud-50">
  <div class="container-page flex h-16 items-center gap-4 sm:gap-8">
    <a href="/" class="flex shrink-0 items-center gap-2.5">
      <span class="font-display text-xl tracking-wide">{SITE_NAME}</span>
    </a>

    <nav class="hidden shrink-0 items-center gap-1 md:flex">
      {#each links as link (link.href)}
        <a
          href={link.href}
          class="rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-cloud-100 transition-colors hover:bg-cloud-700 hover:text-white aria-[current=page]:bg-cloud-700 aria-[current=page]:text-white"
          aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <form onsubmit={submit} class="ml-auto w-full max-w-sm flex-1" role="search">
      <label class="relative block">
        <span class="sr-only">搜尋藍圖</span>
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cloud-500"
        />
        <input
          type="search"
          bind:value={query}
          placeholder="搜尋藍圖名稱"
          class="h-9 w-full rounded-md border border-cloud-700 bg-cloud-50 pr-3 pl-9 text-sm text-cloud-950 placeholder:text-cloud-500 focus:border-cloud-300 focus:outline-none"
        />
      </label>
    </form>

    {#if page.data.user}<NotificationBell />{/if}
    <UserMenu />
  </div>

  <nav class="container-page flex gap-1 pb-2 md:hidden">
    {#each links as link (link.href)}
      <a
        href={link.href}
        class="rounded-md px-3 py-1 text-sm text-cloud-100 aria-[current=page]:bg-cloud-700 aria-[current=page]:text-white"
        aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
      >
        {link.label}
      </a>
    {/each}
  </nav>
</header>
