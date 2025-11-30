'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
    primaryColor: 'violet',
    defaultRadius: 'md',
    autoContrast: true,
    colors: {
        dark: [
            '#C1C2C5',
            '#A6A7AB',
            '#909296',
            '#5C5F66',
            '#373A40',
            '#2C2E33',
            '#25262B',
            '#1A1B1E',
            '#141517',
            '#000000', // Main background
        ],
    },
});
