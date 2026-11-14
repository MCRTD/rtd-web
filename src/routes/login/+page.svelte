<script lang="ts">
  import { Checkbox, Label } from 'bits-ui';
  import { Check, LoaderCircle, TriangleAlert } from '@lucide/svelte';
  import { SITE_NAME } from '#lib/config.js';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let agreed = $state(false);
  let submitting = $state(false);

  const message = $derived(form?.message ?? data.error);
  const canSubmit = $derived(data.configured && (!data.terms || agreed) && !submitting);
</script>

<svelte:head>
  <title>登入 · {SITE_NAME}</title>
</svelte:head>

<div class="container-page flex justify-center py-12">
  <div
    class="flex w-full max-w-xl flex-col gap-6 rounded-lg border border-cloud-300 bg-white p-6 sm:p-8"
  >
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-cloud-950">登入 {SITE_NAME}</h1>
      <p class="text-sm leading-relaxed text-cloud-800">
        使用擁有 Minecraft Java 版的 Microsoft
        帳號登入。登入後，你的玩家名稱會公開顯示在你上傳的藍圖上。
      </p>
    </div>

    {#if message}
      <div
        role="alert"
        class="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
      >
        <TriangleAlert class="mt-0.5 size-4 shrink-0" />
        <span>{message}</span>
      </div>
    {/if}

    {#if !data.configured}
      <p class="rounded-md bg-cloud-100 px-3 py-2.5 text-sm text-cloud-800">
        網站尚未設定 Microsoft 登入，請聯絡管理員。
      </p>
    {/if}

    <form method="POST" onsubmit={() => (submitting = true)} class="flex flex-col gap-5">
      <input type="hidden" name="next" value={data.next} />

      {#if data.terms}
        <input type="hidden" name="terms" value={data.terms.version} />
        <section class="flex flex-col gap-2">
          <h2 class="text-sm font-bold text-cloud-900">服務條款</h2>
          <div
            class="prose prose-sm max-h-72 max-w-none overflow-y-auto rounded-md border border-cloud-200 bg-cloud-50 px-4 py-3 prose-headings:text-cloud-950 prose-h1:text-lg prose-h2:text-base prose-p:text-cloud-900 prose-strong:text-cloud-950 prose-code:before:content-none prose-code:after:content-none prose-li:text-cloud-900"
          >
            {@html data.terms.html}
          </div>
        </section>

        <Label.Root
          for="agree"
          class="flex cursor-pointer items-center gap-2.5 text-sm text-cloud-900"
        >
          <Checkbox.Root
            id="agree"
            name="agree"
            bind:checked={agreed}
            class="flex size-4 shrink-0 items-center justify-center rounded border border-cloud-400 bg-white data-[state=checked]:border-cloud-600 data-[state=checked]:bg-cloud-600"
          >
            {#snippet children({ checked })}
              {#if checked}<Check class="size-3 text-white" strokeWidth={3} />{/if}
            {/snippet}
          </Checkbox.Root>
          我已閱讀並同意服務條款
        </Label.Root>
      {/if}

      <button
        type="submit"
        disabled={!canSubmit}
        class="flex h-12 items-center justify-center gap-3 rounded-lg bg-cloud-600 font-bold text-white shadow-[0_3px_0_0_var(--color-cloud-800)] transition-colors hover:bg-cloud-700 active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:bg-cloud-400 disabled:shadow-none"
      >
        {#if submitting}
          <LoaderCircle class="size-5 animate-spin" />
        {:else}
          <svg viewBox="0 0 21 21" class="size-5" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
        {/if}
        {data.terms ? '同意並以 Microsoft 登入' : '以 Microsoft 登入'}
      </button>
    </form>

    <p class="text-xs leading-relaxed text-cloud-600">
      Microsoft 密碼由 Microsoft 直接處理，本站不會經手。登入過程取得的 Minecraft 存取權杖只用來向
      Mojang 驗證身分一次，用完即丟棄，不會保存。
    </p>
  </div>
</div>
