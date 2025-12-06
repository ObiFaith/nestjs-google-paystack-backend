export default () => ({
  google: {
    apiUrl: process.env.GOOGLE_API_URL ?? '',
    oauthUrl: process.env.GOOGLE_OAUTH_URL ?? '',
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },
});
