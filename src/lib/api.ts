import { error } from '@sveltejs/kit';
import { API_URL } from './config';

export type User = {
  uuid: string;
  username: string;
  created_at: string;
};

export type Tag = {
  slug: string;
  name: string;
};

export type RenderStatus = 'pending' | 'rendering' | 'done' | 'failed' | 'unsupported';

export type Blueprint = {
  id: string;
  owner: { uuid: string; username: string };
  /** 上傳者以外的共同作者，依加入順序。 */
  authors: { uuid: string; username: string }[];
  name: string;
  description: string;
  format: 'litematic' | 'schem';
  tags: string[];
  mc_versions: { min: string | null; max: string | null };
  data_version: number | null;
  size: [number, number, number] | null;
  total_blocks: number | null;
  file: { name: string; size: number; sha256: string };
  cover: {
    url: string | null;
    source: 'image' | 'render' | null;
    image_id: string | null;
  };
  render: {
    status: RenderStatus;
    url: string | null;
    error: string | null;
    mc_version: string | null;
  };
  images: { id: string; url: string; width: number; height: number }[];
  download_count: number;
  view_count: number;
  like_count: number;
  favorite_count: number;
  /** 登入時才有：自己有沒有點讚／收藏。 */
  viewer: { liked: boolean; favorited: boolean } | null;
  created_at: string;
  updated_at: string;
};

export type Paged<T> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
};

export type BlueprintList = Paged<Blueprint>;

export type GroupRole = 'owner' | 'admin' | 'member';

export type Profile = {
  uuid: string;
  username: string;
  bio: string;
  created_at: string;
  stats: {
    blueprints: number;
    downloads: number;
    views: number;
    likes: number;
    favorites: number;
  };
  groups: {
    id: string;
    name: string;
    kind: string;
    role: GroupRole;
    avatar_url: string | null;
  }[];
};

export type ActivityItem = {
  blueprint: Blueprint;
  at: string;
  count: number | null;
};

export type Material = { item: string; count: number };

export type Materials = { items: Material[]; total: number };

export type GroupKind = { slug: string; name: string };

export const LINK_TYPES = [
  'website',
  'discord',
  'youtube',
  'bilibili',
  'twitch',
  'x',
  'github',
  'qq',
  'other'
] as const;

export type LinkType = (typeof LINK_TYPES)[number];

export type GroupLink = { type: LinkType; url: string; label?: string };

export type Group = {
  id: string;
  name: string;
  description: string;
  kind: string;
  join_policy: 'open' | 'invite';
  avatar_url: string | null;
  banner_url: string | null;
  links: GroupLink[];
  owner: { uuid: string; username: string };
  member_count: number;
  blueprint_count: number;
  viewer_role: GroupRole | null;
  viewer_invite: { id: string; role: 'admin' | 'member' } | null;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  uuid: string;
  username: string;
  role: GroupRole;
  joined_at: string;
};

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type GroupInvite = {
  id: string;
  group: { id: string; name: string; kind: string; avatar_url: string | null };
  user: { uuid: string; username: string };
  invited_by: { uuid: string; username: string } | null;
  role: 'admin' | 'member';
  status: InviteStatus;
  created_at: string;
};

type Person = { uuid: string; username: string };
type GroupRef = { id: string; name: string };

export type InviteNotification = {
  kind: 'group_invite';
  data: {
    invite_id: string;
    group: GroupRef;
    invited_by: Person;
    role: 'admin' | 'member';
    status: InviteStatus;
  };
};

export type InviteReplyNotification = {
  kind: 'group_invite_accepted' | 'group_invite_declined';
  data: { invite_id: string; group: GroupRef; user: Person };
};

export type AuthorAddedNotification = {
  kind: 'blueprint_author_added';
  data: { blueprint: { id: string; name: string }; added_by: Person };
};

export type Notification = {
  id: string;
  read_at: string | null;
  created_at: string;
} & (
  | InviteNotification
  | InviteReplyNotification
  | AuthorAddedNotification
  | { kind: 'unknown'; data: Record<string, unknown> }
);

export type NotificationList = Paged<Notification> & { unread: number };

export type BlueprintSort = 'new' | 'updated' | 'downloads' | 'views' | 'likes' | 'favorites';

export type Terms = {
  version: string;
  content: string;
};

export type ListQuery = {
  q?: string;
  owner?: string;
  /** 上傳或共同創作的玩家。 */
  author?: string;
  tags?: string[];
  version?: string;
  group?: string;
  sort?: BlueprintSort;
  page?: number;
  per_page?: number;
};

type Fetch = typeof fetch;

/**
 * 公開資料直接打 rtd-server；`auth` 為 true 時改走本站 /api 代理，帶上登入狀態
 * （藍圖的 viewer 與瀏覽紀錄、群組的 viewer_role 等等）。
 */
async function get<T>(fetcher: Fetch, path: string, auth = false): Promise<T> {
  let res: Response;
  try {
    res = await fetcher(`${auth ? '/api' : API_URL}${path}`, {
      headers: { accept: 'application/json' }
    });
  } catch {
    error(503, '無法連線到 MC RTD 伺服器');
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {}
    error(res.status, message || '發生錯誤');
  }
  return res.json() as Promise<T>;
}

export function listBlueprints(fetcher: Fetch, query: ListQuery = {}, auth = false) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.owner) params.set('owner', query.owner);
  if (query.author) params.set('author', query.author);
  if (query.tags?.length) params.set('tags', query.tags.join(','));
  if (query.version) params.set('version', query.version);
  if (query.group) params.set('group', query.group);
  if (query.sort && query.sort !== 'new') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.per_page) params.set('per_page', String(query.per_page));
  const search = params.toString();
  return get<BlueprintList>(fetcher, `/blueprints${search ? `?${search}` : ''}`, auth);
}

export const getBlueprint = (fetcher: Fetch, id: string, auth = false) =>
  get<Blueprint>(fetcher, `/blueprints/${id}`, auth);

export const getMaterials = (fetcher: Fetch, id: string) =>
  get<Materials>(fetcher, `/blueprints/${id}/materials`);

export const getUser = (fetcher: Fetch, uuid: string) => get<Profile>(fetcher, `/users/${uuid}`);

function pageQuery(page = 1, perPage?: number, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  if (page > 1) params.set('page', String(page));
  if (perPage) params.set('per_page', String(perPage));
  return params.size ? `?${params}` : '';
}

export type ActivityKind = 'likes' | 'favorites' | 'views' | 'downloads';

/** 自己的點讚、收藏、瀏覽與下載紀錄，只能透過代理拿。 */
export const getMyActivity = (fetcher: Fetch, kind: ActivityKind, page = 1, perPage?: number) =>
  get<Paged<ActivityItem>>(fetcher, `/users/me/${kind}${pageQuery(page, perPage)}`, true);

export const getMyInvites = (fetcher: Fetch) =>
  get<Paged<GroupInvite>>(fetcher, `/users/me/invites${pageQuery(1, 100)}`, true);

export const getGroupKinds = (fetcher: Fetch) => get<GroupKind[]>(fetcher, '/group-kinds');

export type GroupSort = 'new' | 'members' | 'blueprints';

export type GroupQuery = {
  q?: string;
  kind?: string;
  member?: string;
  sort?: GroupSort;
  page?: number;
  per_page?: number;
};

export function listGroups(fetcher: Fetch, query: GroupQuery = {}, auth = false) {
  const extra: Record<string, string> = {};
  if (query.q) extra.q = query.q;
  if (query.kind) extra.kind = query.kind;
  if (query.member) extra.member = query.member;
  if (query.sort && query.sort !== 'new') extra.sort = query.sort;
  return get<Paged<Group>>(fetcher, `/groups${pageQuery(query.page, query.per_page, extra)}`, auth);
}

export const getGroup = (fetcher: Fetch, id: string, auth = false) =>
  get<Group>(fetcher, `/groups/${id}`, auth);

export const getGroupMembers = (fetcher: Fetch, id: string, page = 1, perPage?: number) =>
  get<Paged<GroupMember>>(fetcher, `/groups/${id}/members${pageQuery(page, perPage)}`);

export const getGroupInvites = (fetcher: Fetch, id: string) =>
  get<Paged<GroupInvite>>(fetcher, `/groups/${id}/invites${pageQuery(1, 100)}`, true);

export const getNotifications = (fetcher: Fetch, page = 1, unread = false) =>
  get<NotificationList>(
    fetcher,
    `/notifications${pageQuery(page, 30, unread ? { unread: 'true' } : {})}`,
    true
  );

export const getTags = (fetcher: Fetch) => get<Tag[]>(fetcher, '/tags');

export const getTerms = (fetcher: Fetch) => get<Terms>(fetcher, '/terms');

export const downloadUrl = (id: string) => `${API_URL}/blueprints/${id}/download`;

export const previewUrl = (id: string) => `${API_URL}/blueprints/${id}/preview`;

export const avatarUrl = (uuid: string, size = 64) =>
  `https://mc-heads.net/avatar/${uuid.replaceAll('-', '')}/${size}`;
