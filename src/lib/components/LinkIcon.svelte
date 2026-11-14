<script lang="ts">
  import {
    AtSign,
    Code,
    Globe,
    Link,
    MessageCircle,
    MessageSquare,
    Play,
    Radio,
    Tv
  } from '@lucide/svelte';
  import type { LinkType } from '#lib/api.js';

  let { type, class: className = 'size-4' }: { type: LinkType; class?: string } = $props();

  // 這個版本的 lucide 沒有品牌圖示，用意思相近的通用圖示。
  const icons = {
    website: Globe,
    discord: MessageCircle,
    youtube: Play,
    bilibili: Tv,
    twitch: Radio,
    x: AtSign,
    github: Code,
    qq: MessageSquare,
    other: Link
  };
  const Icon = $derived(icons[type] ?? Link);
</script>

<Icon class={className} />
