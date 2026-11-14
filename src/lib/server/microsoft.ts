import { MS_CLIENT_ID, MS_CLIENT_SECRET } from '$app/env/private';

const AUTHORIZE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const XBL_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_LOGIN_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';
const SCOPE = 'XboxLive.signin';

export class LoginError extends Error {}

const XSTS_ERRORS: Record<string, string> = {
  '2148916227': '這個 Xbox 帳號已被停權。',
  '2148916229': '這個帳號受家長監護限制，需要家長允許線上遊戲。',
  '2148916233': '這個 Microsoft 帳號還沒有 Xbox 個人檔案，請先到 xbox.com 登入一次建立。',
  '2148916235': '你所在的地區無法使用 Xbox Live。',
  '2148916236': '這個帳號需要先完成成人驗證。',
  '2148916237': '這個帳號需要先完成成人驗證。',
  '2148916238': '未滿 18 歲的帳號需要先加入 Microsoft 家庭群組。'
};

function base64url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const randomToken = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

async function codeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function isConfigured() {
  return Boolean(MS_CLIENT_ID);
}

export async function authorizeUrl(options: {
  redirectUri: string;
  state: string;
  verifier: string;
}) {
  if (!MS_CLIENT_ID) throw new LoginError('網站尚未設定 Microsoft 登入。');
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: options.redirectUri,
    response_mode: 'query',
    scope: SCOPE,
    state: options.state,
    code_challenge: await codeChallenge(options.verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account'
  });
  return `${AUTHORIZE_URL}?${params}`;
}

async function postJson(url: string, body: unknown, step: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  return { res, data, step };
}

async function microsoftToken(code: string, redirectUri: string, verifier: string) {
  const form = new URLSearchParams({
    client_id: MS_CLIENT_ID ?? '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    scope: SCOPE
  });
  if (MS_CLIENT_SECRET) form.set('client_secret', MS_CLIENT_SECRET);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    console.error(
      'Microsoft token exchange failed',
      res.status,
      data?.error,
      data?.error_description
    );
    throw new LoginError('Microsoft 登入失敗，請再試一次。');
  }
  return data.access_token as string;
}

async function xboxToken(msToken: string) {
  const { res, data } = await postJson(
    XBL_URL,
    {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${msToken}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    },
    'xbl'
  );
  const uhs = data?.DisplayClaims?.xui?.[0]?.uhs;
  if (!res.ok || !data?.Token || !uhs) {
    console.error('Xbox Live authentication failed', res.status, data);
    throw new LoginError('Xbox Live 驗證失敗，請再試一次。');
  }
  return { token: data.Token as string, uhs: uhs as string };
}

async function xstsToken(xblToken: string) {
  const { res, data } = await postJson(
    XSTS_URL,
    {
      Properties: { SandboxId: 'RETAIL', UserTokens: [xblToken] },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    },
    'xsts'
  );
  if (data?.XErr) {
    throw new LoginError(XSTS_ERRORS[String(data.XErr)] ?? `Xbox Live 拒絕登入（${data.XErr}）。`);
  }
  if (!res.ok || !data?.Token) {
    console.error('XSTS authorization failed', res.status, data);
    throw new LoginError('Xbox Live 驗證失敗，請再試一次。');
  }
  return data.Token as string;
}

async function minecraftToken(uhs: string, xsts: string) {
  const { res, data } = await postJson(
    MC_LOGIN_URL,
    { identityToken: `XBL3.0 x=${uhs};${xsts}` },
    'minecraft'
  );
  if (res.status === 403) {
    console.error('Minecraft login_with_xbox rejected the app registration', data);
    throw new LoginError('這個網站的 Microsoft 應用程式尚未獲准使用 Minecraft 登入。');
  }
  if (!res.ok || !data?.access_token) {
    console.error('Minecraft authentication failed', res.status, data);
    throw new LoginError('Minecraft 驗證失敗，請再試一次。');
  }
  return data.access_token as string;
}

async function minecraftProfile(mcToken: string) {
  const res = await fetch(MC_PROFILE_URL, { headers: { authorization: `Bearer ${mcToken}` } });
  if (res.status === 404) throw new LoginError('這個帳號沒有 Minecraft Java 版。');
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.id || !data?.name) {
    console.error('Minecraft profile request failed', res.status, data);
    throw new LoginError('讀取 Minecraft 玩家資料失敗。');
  }
  return { uuid: data.id as string, username: data.name as string };
}

export async function minecraftSession(code: string, redirectUri: string, verifier: string) {
  const msToken = await microsoftToken(code, redirectUri, verifier);
  const xbl = await xboxToken(msToken);
  const xsts = await xstsToken(xbl.token);
  const accessToken = await minecraftToken(xbl.uhs, xsts);
  const profile = await minecraftProfile(accessToken);
  return { accessToken, ...profile };
}
