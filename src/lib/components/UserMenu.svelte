<script lang="ts">
  import { page } from '$app/state';
  import { DropdownMenu } from 'bits-ui';
  import { Bell, Bookmark, ChevronDown, LayoutGrid, LogOut, Upload, Users } from '@lucide/svelte';
  import { avatarUrl } from '#lib/api.js';
  import { logout } from '#lib/client.js';

  const user = $derived(page.data.user);
  const here = $derived(page.url.pathname + page.url.search);
  const loginHref = $derived(
    page.url.pathname === '/login' ? '/login' : `/login?next=${encodeURIComponent(here)}`
  );

  const item =
    'flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm text-cloud-900 outline-none select-none data-highlighted:bg-cloud-100';
</script>

{#if user}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="flex shrink-0 items-center gap-2 rounded-md py-1 pr-2 pl-1 text-sm font-medium text-cloud-50 transition-colors hover:bg-cloud-700 data-[state=open]:bg-cloud-700"
    >
      <img
        src={avatarUrl(user.uuid, 32)}
        alt=""
        class="size-7 rounded [image-rendering:pixelated]"
      />
      <span class="hidden max-w-32 truncate sm:inline">{user.username}</span>
      <ChevronDown class="size-4 text-cloud-200" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end"
        sideOffset={6}
        class="z-50 w-48 rounded-md border border-cloud-300 bg-white p-1 shadow-lg"
      >
        <div class="px-2.5 py-2">
          <p class="truncate text-sm font-bold text-cloud-950">{user.username}</p>
        </div>
        <DropdownMenu.Separator class="my-1 h-px bg-cloud-200" />
        <DropdownMenu.Item class={item}>
          {#snippet child({ props })}
            <a {...props} href="/users/{user.uuid}"
              ><LayoutGrid class="size-4 text-cloud-600" />我的頁面</a
            >
          {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item class={item}>
          {#snippet child({ props })}
            <a {...props} href="/users/{user.uuid}?tab=favorites"
              ><Bookmark class="size-4 text-cloud-600" />我的收藏</a
            >
          {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item class={item}>
          {#snippet child({ props })}
            <a {...props} href="/groups?member={user.uuid}"
              ><Users class="size-4 text-cloud-600" />我的群組</a
            >
          {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item class={item}>
          {#snippet child({ props })}
            <a {...props} href="/notifications"><Bell class="size-4 text-cloud-600" />通知</a>
          {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item class={item}>
          {#snippet child({ props })}
            <a {...props} href="/upload"><Upload class="size-4 text-cloud-600" />上傳藍圖</a>
          {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Separator class="my-1 h-px bg-cloud-200" />
        <DropdownMenu.Item class={item} onSelect={logout}>
          <LogOut class="size-4 text-cloud-600" />登出
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{:else}
  <a
    href={loginHref}
    class="shrink-0 rounded-md border border-cloud-300 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cloud-700"
  >
    登入
  </a>
{/if}
