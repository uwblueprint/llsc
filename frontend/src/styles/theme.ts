import { createSystem, defaultConfig, defineConfig, defineTokens } from '@chakra-ui/react';

const brandTokens = defineTokens({
  colors: {
    brand: {
      primary: { value: '#056067' },
      primaryEmphasis: { value: '#044953' },
      primaryMuted: { value: '#B3CED1' },
      primaryAlpha: { value: 'rgba(5, 96, 103, 0.08)' }, // 8% opacity for subtle hover states
      primaryLight: { value: '#E6F4F5' }, // Very light teal for hover backgrounds
      navy: { value: '#1D3448' },
      navyMuted: { value: '#41576B' },
      fieldText: { value: '#414651' },
      background: { value: '#F6F7FB' },
      surface: { value: '#FFFFFF' },
      border: { value: '#D5D7DA' },
    },
  },
  spacing: {
    18: { value: '4.5rem' },
    22: { value: '5.5rem' },
  },
  radii: {
    xl: { value: '1.25rem' },
    '2xl': { value: '1.75rem' },
  },
});

const customThemeConfig = defineConfig({
  theme: {
    breakpoints: {
      sm: '30em', // 480px
      md: '48em', // 768px
      lg: '62em', // 992px
      xl: '80em', // 1280px
      '2xl': '96em', // 1536px
    },
    tokens: brandTokens,
  },
  globalCss: {
    body: {
      backgroundColor: '#F6F7FB',
      color: '#1D3448',
      fontFamily: "'Open Sans', Arial, Helvetica, sans-serif",
    },
  },
});

export const system = createSystem(defaultConfig, customThemeConfig);
