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

export interface UserReq {
  id: string;
  email: string;
}

export interface PayloadData {
  amount: number;
  reference: string;
}

export interface Payload {
  event: string;
  data: PayloadData;
}

export interface Wallet {
  wallet_number: string;
  balance: number;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  google_id: string | null;
  picture: string | null;
  email_verified: boolean;
  access_token: string;
  wallet_number: string;
  balance: number;
}

export interface AuthRequest extends Request {
  user: UserReq;
  rawBody?: string;
}

export interface InitiatePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyPaymentResponse {
  status: string;
  amount: number;
  paid_at: Date;
  reference: string;
}
