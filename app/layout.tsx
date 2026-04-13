'use client';

import * as React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme/theme';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}