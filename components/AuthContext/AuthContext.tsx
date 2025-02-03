'use client';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

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
