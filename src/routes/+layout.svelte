<script lang="ts">
  import './layout.css';
  import { Tooltip } from 'bits-ui';
  import Header from '#lib/components/Header.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<Tooltip.Provider delayDuration={200}>
  <div class="flex min-h-dvh flex-col">
    <Header />
    <main class="flex-1">
      {@render children()}
    </main>
    <Footer />
  </div>
</Tooltip.Provider>
