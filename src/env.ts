import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value?.trim() || undefined;

export const variables = defineEnvVars({
  MS_CLIENT_ID: {
    schema: optional,
    description: 'Microsoft Entra 應用程式（用戶端）識別碼，需已通過 Minecraft API 審核'
  },
  MS_CLIENT_SECRET: {
    schema: optional,
    description: 'Web 平台的用戶端密碼；應用程式註冊為公用用戶端時可省略'
  }
});
