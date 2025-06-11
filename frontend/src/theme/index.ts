import { extendTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    50: '#e3f8f6',
    100: '#b3e9e3',
    200: '#81d9d0',
    300: '#4fc9bd',
    400: '#23b9aa',
    500: '#056067', // Figma teal
    600: '#044d4d',
    700: '#033a3a',
    800: '#012727',
    900: '#001414',
  },
  veniceBlue: '#1d3448',
  fieldGray: '#414651',
  background: '#f7fafc',
  border: '#e2e8f0',
};

const fonts = {
  heading: "'Open Sans', sans-serif",
  body: "'Open Sans', sans-serif",
};

const theme = extendTheme({
  colors,
  fonts,
  components: {
    Button: {
      baseStyle: {
        fontWeight: 600,
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: { bg: 'brand.600' },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'veniceBlue',
        fontWeight: 600,
      },
    },
    Textarea: {
      baseStyle: {
        bg: 'background',
        borderColor: 'border',
        _focus: {
          borderColor: 'brand.400',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
        },
      },
    },
  },
});

export default theme; 