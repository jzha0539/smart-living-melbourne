'use client';

import * as React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme/theme';
import 'mapbox-gl/dist/mapbox-gl.css';
import Chatbot from '@/components/Chatbot'

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
          <Chatbot/>
        </ThemeProvider>
      </body>
    </html>
  );
}