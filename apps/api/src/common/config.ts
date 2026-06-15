/** Zentral gelesene Env-Konfiguration mit Defaults für Dev. */
export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPort: Number(process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",

  jwt: {
    accessSecret: process.env.JWT_SECRET ?? "dev_access_secret_change_me_32_chars__",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret_change_me_32_chars_",
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtlDays: 7,
  },

  discord: {
    clientId: process.env.DISCORD_CLIENT_ID ?? "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    callbackUrl:
      process.env.DISCORD_CALLBACK_URL ??
      "http://localhost:4000/api/v1/auth/discord/callback",
  },

  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSsl: (process.env.MINIO_USE_SSL ?? "false") === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
    bucket: process.env.MINIO_BUCKET ?? "aktensystem-documents",
  },

  fivemBridgeToken: process.env.FIVEM_BRIDGE_TOKEN ?? "change_me_fivem_shared_secret",
};
