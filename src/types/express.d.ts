import { UserPayload } from '../auth/interfaces/user-payload.interface';

declare module 'express' {
  interface Request {
    user: UserPayload;
  }
}

