import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    SpotifyProvider({
      authorization:
        'https://accounts.spotify.com/authorize?scope=user-read-email,playlist-read-private&show_dialog=true',
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async session({ session, user, token }) {
      session.token = token;
      if(session.user) {
        session.user._id = user.id;
      }
      return session;
    }
  },
  secret: process.env.SESSION_SECRET
};

export default NextAuth(authOptions);
