<script lang="ts">
  import { SITE_FULL_NAME, SITE_NAME } from '#lib/config.js';
</script>

<footer class="mt-16 border-t border-cloud-300 bg-cloud-200">
  <div
    class="container-page flex flex-col gap-3 py-8 text-sm text-cloud-800 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex items-baseline gap-2">
      <span class="font-display">{SITE_NAME}</span>
      <span class="text-cloud-600">{SITE_FULL_NAME}</span>
    </div>
    <p class="text-cloud-700">
      非官方服務，MCRTD與 Mojang Studios、Microsoft 無關。Minecraft 是 Mojang Synergies AB 的商標。
    </p>
    <a href="/terms" class="font-medium underline-offset-4 hover:underline">服務條款</a>
  </div>
</footer>
