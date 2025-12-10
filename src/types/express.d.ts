declare module 'express' {
  export interface Request {
    rawBody: string;
  }
}
