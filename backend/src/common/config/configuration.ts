/**
 * Central place for env-driven config, so no OPEN-BUSINESS-DECISION value
 * (OTP timing, JWT TTLs, etc.) is ever a literal buried in application code.
 * Business-policy values that additionally need runtime editability (by an
 * Admin, without a redeploy) belong in the `policy_settings` DB table
 * instead — see backend/prisma/seed.ts for the OTP policy example.
 */
export default () => ({
  port: parseInt(process.env.BACKEND_PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  otp: {
    // ARCH-DECISION-10: HMAC secret for OTP code hashing — never argon2, see
    // docs/ARCHITECTURE.md §9. This is a distinct secret from JWT signing.
    hmacSecret: process.env.OTP_HMAC_SECRET,
  },
  sms: {
    // Provider itself is OPEN-BUSINESS-DECISION-31 — 'noop' logs instead of
    // sending, so local dev and tests never depend on a real gateway.
    provider: process.env.SMS_PROVIDER ?? 'noop',
    apiKey: process.env.SMS_PROVIDER_API_KEY,
  },
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  },
});
