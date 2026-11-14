import type { Blueprint } from './api';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES = 10;
export const MAX_TAGS = 5;
export const MAX_NAME_LEN = 100;
export const MAX_DESCRIPTION_LEN = 5000;
export const MAX_AUTHORS = 10;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const BLUEPRINT_EXTENSIONS = ['.litematic', '.schem'];

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

const patterns: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/unsupported file type/, '只支援 .litematic 或 .schem 檔案。'],
  [/missing `file`/, '請選擇藍圖檔案。'],
  [/at most \d+ tags/, `最多只能選 ${MAX_TAGS} 個標籤。`],
  [/unknown tags/, '有不存在的標籤，請重新整理後再試。'],
  [/at most \d+ images/, `每個藍圖最多 ${MAX_IMAGES} 張截圖。`],
  [/images must be PNG, JPEG or WebP/, '截圖只接受 PNG、JPEG 或 WebP。'],
  [/name cannot be empty/, '名稱不能空白。'],
  [/name is longer than (\d+)/, (m) => `名稱最多 ${m[1]} 字。`],
  [/description is longer than (\d+)/, (m) => `說明最多 ${m[1]} 字。`],
  [/must be a release such as/, '版本格式不正確，請使用正式版版本號（例如 1.20.1）。'],
  [/mc_version_min is newer than mc_version_max/, '最低版本不能比最高版本新。'],
  [/too large once decompressed/, '藍圖解壓縮後太大了。'],
  [/blueprint is too large/, '藍圖體積超過上限。'],
  [/cannot be re-rendered right now/, '目前無法重新渲染，可能已經在渲染中。'],
  [/only the uploader can change/, '只有上傳者可以修改這個藍圖。'],
  [/cannot like your own blueprint/, '不能對自己的藍圖點讚。'],
  [/requires the (\w+) role/, (m) => `需要群組${ROLE_LABELS[m[1]] ?? m[1]}以上的權限。`],
  [/this group is invite-only/, '這個群組需要邀請才能加入。'],
  [/only the owner can (invite|add) admins/, '只有擁有者可以邀請管理員。'],
  [/never signed in here/, '這位玩家還沒有登入過 MC RTD，請對方先登入一次。'],
  [/already a member/, '這位玩家已經是成員了。'],
  [/already has an open invite/, '已經邀請過這位玩家，正在等待回覆。'],
  [/at most (\d+) open invites/, (m) => `待回覆的邀請最多 ${m[1]} 個。`],
  [/this invite is already (\w+)/, (m) => `這個邀請已經${INVITE_LABELS[m[1]] ?? m[1]}了。`],
  [/the owner cannot leave/, '擁有者不能退出群組，請先轉移擁有者或刪除群組。'],
  [/cannot remove this member/, '你沒有權限移除這位成員。'],
  [/hand the group to someone else/, '要變更自己的角色，請先把群組轉移給其他人。'],
  [/you can only add blueprints you authored/, '只能加入自己上傳或共同創作的藍圖。'],
  [/the uploader is already an author/, '上傳者不用加入共同作者。'],
  [/at most (\d+) co-authors/, (m) => `共同作者最多 ${m[1]} 位。`],
  [/no such user/, '找不到這位玩家，對方要先登入過 MC RTD 一次。'],
  [/cannot remove this blueprint from the group/, '你沒有權限把這個藍圖移出群組。'],
  [/you can own at most (\d+) groups/, (m) => `每人最多擁有 ${m[1]} 個群組。`],
  [/unknown kind/, '群組類型不存在，請重新整理後再試。'],
  [/join_policy must be/, '加入方式不正確。'],
  [/at most (\d+) links/, (m) => `社群連結最多 ${m[1]} 個。`],
  [/unknown link type/, '連結類型不正確。'],
  [/links must be http\(s\) URLs/, '連結必須是 http:// 或 https:// 開頭的網址。'],
  [/link labels are at most (\d+)/, (m) => `連結名稱最多 ${m[1]} 字。`],
  [/bio is longer than (\d+)/, (m) => `自我介紹最多 ${m[1]} 字。`],
  [/image must be square/, '頭像必須是正方形。'],
  [/no such blueprint/, '找不到這個藍圖。']
];

const ROLE_LABELS: Record<string, string> = {
  owner: '擁有者',
  admin: '管理員',
  member: '成員'
};
const INVITE_LABELS: Record<string, string> = {
  accepted: '接受',
  declined: '拒絕',
  cancelled: '取消'
};

function translate(status: number, code: string, message: string) {
  switch (code) {
    case 'unauthorized':
      return '登入已過期，請重新登入。';
    case 'not_found':
      return '找不到資料，可能已被刪除。';
    case 'payload_too_large':
      return '檔案太大了。';
    case 'unavailable':
      return '無法連線到 MC RTD 伺服器。';
  }
  if (message === 'cross-origin request') return '請求來源不符，請重新整理頁面。';
  for (const [pattern, text] of patterns) {
    const match = message.match(pattern);
    if (match) return typeof text === 'string' ? text : text(match);
  }
  if (code === 'forbidden') return '你沒有權限進行這個操作。';
  if (status === 413) return '檔案太大了。';
  if (status >= 500) return '伺服器發生錯誤，請稍後再試。';
  return message ? `檔案無法處理：${message}` : '發生錯誤，請再試一次。';
}

type Body = FormData | Record<string, unknown> | null | undefined;

export function request<T = Blueprint>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: Body,
  onProgress?: (fraction: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `/api${path}`);
    xhr.setRequestHeader('accept', 'application/json');
    xhr.responseType = 'text';

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }

    xhr.onload = () => {
      let data: any = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);
      } else {
        const code = data?.error ?? '';
        reject(new ApiError(xhr.status, code, translate(xhr.status, code, data?.message ?? '')));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'unavailable', translate(0, 'unavailable', '')));

    if (body instanceof FormData) {
      xhr.send(body);
    } else if (body != null) {
      xhr.setRequestHeader('content-type', 'application/json');
      xhr.send(JSON.stringify(body));
    } else {
      xhr.send();
    }
  });
}

export function compareVersions(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

export const errorMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : '發生錯誤，請再試一次。';

export function isBlueprintFile(file: File) {
  const name = file.name.toLowerCase();
  return BLUEPRINT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function checkImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) return `「${file.name}」不是 PNG、JPEG 或 WebP。`;
  if (file.size > MAX_IMAGE_BYTES) return `「${file.name}」超過 10 MB。`;
  return null;
}

export async function logout() {
  try {
    await fetch('/auth/logout', { method: 'POST' });
  } finally {
    location.reload();
  }
}
