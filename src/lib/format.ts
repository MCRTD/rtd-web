const numberFormat = new Intl.NumberFormat('zh-TW');
const compactFormat = new Intl.NumberFormat('zh-TW', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const dateFormat = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const relativeFormat = new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' });

export const formatNumber = (n: number) => numberFormat.format(n);

export const formatCompact = (n: number) => compactFormat.format(n);

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatRelative(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return '剛剛';
}

export function formatVersionRange(min: string | null, max: string | null) {
  if (min && max) return min === max ? min : `${min} – ${max}`;
  if (min) return `${min} 以上`;
  if (max) return `${max} 以下`;
  return '未標示';
}

export const formatSize = (size: [number, number, number]) => size.join(' × ');

/** `minecraft:polished_andesite` → `polished andesite`；其他命名空間保留前綴。 */
export function itemName(id: string) {
  const [ns, name] = id.includes(':') ? id.split(':', 2) : ['minecraft', id];
  const pretty = name.replaceAll('_', ' ');
  return ns === 'minecraft' ? pretty : `${ns}:${pretty}`;
}

/** 以一組 64 個、一盒 27 組換算：3 盒 + 5 組 + 12 個。 */
export function formatStacks(count: number, stack = 64) {
  const box = stack * 27;
  const parts: string[] = [];
  const boxes = Math.floor(count / box);
  const stacks = Math.floor((count % box) / stack);
  const rest = count % stack;
  if (boxes) parts.push(`${boxes} 盒`);
  if (stacks) parts.push(`${stacks} 組`);
  if (rest || !parts.length) parts.push(`${rest} 個`);
  return parts.join(' + ');
}
