import type { GroupRole, LinkType } from './api';

export const ROLE_LABELS: Record<GroupRole, string> = {
  owner: '擁有者',
  admin: '管理員',
  member: '成員'
};

export const LINK_LABELS: Record<LinkType, string> = {
  website: '網站',
  discord: 'Discord',
  youtube: 'YouTube',
  bilibili: 'bilibili',
  twitch: 'Twitch',
  x: 'X',
  github: 'GitHub',
  qq: 'QQ',
  other: '其他'
};

export const MAX_LINKS = 10;
export const MAX_GROUP_NAME_LEN = 100;
export const MAX_GROUP_DESCRIPTION_LEN = 5000;
export const MAX_BIO_LEN = 500;

const RANK: Record<GroupRole, number> = { member: 1, admin: 2, owner: 3 };

export const atLeast = (role: GroupRole | null | undefined, min: GroupRole) =>
  !!role && RANK[role] >= RANK[min];

export const outranks = (a: GroupRole, b: GroupRole) => RANK[a] > RANK[b];
