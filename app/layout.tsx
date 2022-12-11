import { AuthContext } from '@/components/AuthContext';
import { Wrapper } from '@/components/Wrapper';

export default function RootLayout({
  children
}: {
  children: React.ReactNode,
}) {
  return (
    <AuthContext>
      <html lang="en">
        {/*
          <head /> will contain the components returned by the nearest parent
          head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
        */}
        <head />
        <Wrapper>
          {children}
        </Wrapper>
      </html>
    </AuthContext>
  )
}
