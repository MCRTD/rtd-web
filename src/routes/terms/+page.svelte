<script lang="ts">
  import { SITE_NAME } from '#lib/config.js';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>服務條款 · {SITE_NAME}</title>
</svelte:head>

<div class="container-page py-10">
  <article
    class="mx-auto prose max-w-3xl rounded-lg border border-cloud-300 bg-white p-6 sm:p-10 prose-headings:text-cloud-950 prose-p:text-cloud-900 prose-a:text-cloud-700 prose-strong:text-cloud-950 prose-code:rounded prose-code:bg-cloud-100 prose-code:px-1 prose-code:before:content-none prose-code:after:content-none prose-li:text-cloud-900 prose-li:marker:text-cloud-500"
  >
    {@html data.html}
    <p class="mt-10 border-t border-cloud-200 pt-4 font-mono text-xs text-cloud-500">
      版本 {data.version}
    </p>
  </article>
</div>
