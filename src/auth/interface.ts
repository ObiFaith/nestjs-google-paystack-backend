export interface CallbackQuery {
  code: string;
  scope: string;
  prompt: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
  refresh_token: string;
}

export interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
}

export interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string };
}
