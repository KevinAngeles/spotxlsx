'use client'
import { ReactNode } from 'react';
import createEmotionCache from '@/utils/createEmotionCache';
import { CacheProvider, ThemeProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material';
import theme from '@/assets/theme';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const Wrapper = ({
  children,
}: {
  children: ReactNode
}) => {
  return (
    <CacheProvider value={clientSideEmotionCache}>
        <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <body>{children}</body>
        </ThemeProvider>
    </CacheProvider>
  )
}

export default Wrapper;
