export {};
import { JWT } from 'next-auth/jwt';
import { MongoClient } from 'mongodb';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    _id?: string | undefined;
  }
  interface Session {
    token?: JWT & { user?: User };
    user?: User;
  }
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | null;
}