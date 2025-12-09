export default () => ({
  app: {
    host: process.env.HOST ?? '0.0.0.0',
    port: process.env.PORT ?? 3000
  },
  db: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwtSecret: process.env.JWT_SECRET ?? '',
  paystack: {
    apiUrl: process.env.PAYSTACK_API_URL ?? '',
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
  },
  google: {
    apiUrl: process.env.GOOGLE_API_URL ?? '',
    oauthUrl: process.env.GOOGLE_OAUTH_URL ?? '',
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },
});
