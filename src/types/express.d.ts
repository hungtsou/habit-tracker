import { AuthPayload } from '.';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}
