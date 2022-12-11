'use client';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth/core/types.d';

type AuthContextProps = {
  children: ReactNode;
  // session: Session
}

const AuthContext = ({ children/*, session*/ }: AuthContextProps) => {
  return (
    <SessionProvider /*session={session}*/>
      {children}
    </SessionProvider>
  )
}

export default AuthContext;
