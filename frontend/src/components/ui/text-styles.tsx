import React from 'react';
import { Text as ChakraText, TextProps } from '@chakra-ui/react';

// Base text with Open Sans
const baseTextProps: TextProps = {
  fontFamily: "'Open Sans', sans-serif",
};

// Heading styles
export function Heading1(props: TextProps) {
  return (
    <ChakraText
      {...baseTextProps}
      fontWeight={600}
      fontSize="34px"
      lineHeight="1.36"
      letterSpacing="-1.5%"
      {...props}
    />
  );
}

export function Heading2(props: TextProps) {
  return (
    <ChakraText
      {...baseTextProps}
      fontWeight={600}
      fontSize="24px"
      lineHeight="1.36"
      letterSpacing="-1.5%"
      {...props}
    />
  );
}

export function Heading3(props: TextProps) {
  return (
    <ChakraText {...baseTextProps} fontWeight={600} fontSize="22px" lineHeight="1.36" {...props} />
  );
}

// Body text styles
export function BodyLarge(props: TextProps) {
  return (
    <ChakraText {...baseTextProps} fontWeight={400} fontSize="22px" lineHeight="1.36" {...props} />
  );
}

export function BodyMedium(props: TextProps) {
  return (
    <ChakraText {...baseTextProps} fontWeight={400} fontSize="20px" lineHeight="1.36" {...props} />
  );
}

export function BodySmall(props: TextProps) {
  return (
    <ChakraText {...baseTextProps} fontWeight={400} fontSize="16px" lineHeight="1.36" {...props} />
  );
}

// Label/header styles
export function LabelBold(props: TextProps) {
  return (
    <ChakraText {...baseTextProps} fontWeight={600} fontSize="16px" lineHeight="1.36" {...props} />
  );
}

export function LabelSmall(props: TextProps) {
  return (
    <ChakraText {...baseTextProps} fontWeight={600} fontSize="14px" lineHeight="1.43" {...props} />
  );
}

// Navigation/button text
export function NavText(props: TextProps) {
  return (
    <ChakraText
      {...baseTextProps}
      fontWeight={600}
      fontSize="20px"
      lineHeight="1.36"
      letterSpacing="-1.5%"
      {...props}
    />
  );
}

// Small body text
export function TextSmall(props: TextProps) {
  return (
    <ChakraText {...baseTextProps} fontWeight={400} fontSize="14px" lineHeight="1.43" {...props} />
  );
}
