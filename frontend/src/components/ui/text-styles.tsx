import { Text as ChakraText, TextProps } from '@chakra-ui/react';

// Base text with Open Sans
const baseTextProps: TextProps = {
  fontFamily: "'Open Sans', sans-serif",
};

// Heading styles
export const Heading1 = (props: TextProps) => (
  <ChakraText
    {...baseTextProps}
    fontWeight={600}
    fontSize="34px"
    lineHeight="1.36"
    letterSpacing="-1.5%"
    {...props}
  />
);

export const Heading2 = (props: TextProps) => (
  <ChakraText
    {...baseTextProps}
    fontWeight={600}
    fontSize="24px"
    lineHeight="1.36"
    letterSpacing="-1.5%"
    {...props}
  />
);

export const Heading3 = (props: TextProps) => (
  <ChakraText {...baseTextProps} fontWeight={600} fontSize="22px" lineHeight="1.36" {...props} />
);

// Body text styles
export const BodyLarge = (props: TextProps) => (
  <ChakraText {...baseTextProps} fontWeight={400} fontSize="22px" lineHeight="1.36" {...props} />
);

export const BodyMedium = (props: TextProps) => (
  <ChakraText {...baseTextProps} fontWeight={400} fontSize="20px" lineHeight="1.36" {...props} />
);

export const BodySmall = (props: TextProps) => (
  <ChakraText {...baseTextProps} fontWeight={400} fontSize="16px" lineHeight="1.36" {...props} />
);

// Label/header styles
export const LabelBold = (props: TextProps) => (
  <ChakraText {...baseTextProps} fontWeight={600} fontSize="16px" lineHeight="1.36" {...props} />
);

export const LabelSmall = (props: TextProps) => (
  <ChakraText {...baseTextProps} fontWeight={600} fontSize="14px" lineHeight="1.43" {...props} />
);

// Navigation/button text
export const NavText = (props: TextProps) => (
  <ChakraText
    {...baseTextProps}
    fontWeight={600}
    fontSize="20px"
    lineHeight="1.36"
    letterSpacing="-1.5%"
    {...props}
  />
);

// Small body text
export const TextSmall = (props: TextProps) => (
  <ChakraText {...baseTextProps} fontWeight={400} fontSize="14px" lineHeight="1.43" {...props} />
);
