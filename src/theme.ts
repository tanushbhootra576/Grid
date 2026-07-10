'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'var(--font-space), system-ui, sans-serif',
  headings: {
    fontFamily: 'var(--font-space), system-ui, sans-serif',
    sizes: {
      h1: { fontSize: '4rem',   lineHeight: '1',    fontWeight: '700' },
      h2: { fontSize: '2.5rem', lineHeight: '1.1',  fontWeight: '700' },
      h3: { fontSize: '1.5rem', lineHeight: '1.2',  fontWeight: '600' },
    },
  },
  // Grid: ember orange primary
  primaryColor: 'orange',
  defaultRadius: 0,
  autoContrast: true,
  colors: {
    dark: [
      '#F5F0EB', // [0] primary text on dark — ash cream
      '#A09890', // [1] muted
      '#7A7068', // [2]
      '#4A443E', // [3]
      '#302C28', // [4]
      '#242018', // [5] borders
      '#161412', // [6] card bg
      '#0D0C0B', // [7] page bg — grid iron
      '#090807', // [8]
      '#040404', // [9]
    ],
  },
});
