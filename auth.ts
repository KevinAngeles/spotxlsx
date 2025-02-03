import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import Spotify from "next-auth/providers/spotify"
import client from "./lib/mongodb"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: MongoDBAdapter(client),
    providers: [Spotify],
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
})