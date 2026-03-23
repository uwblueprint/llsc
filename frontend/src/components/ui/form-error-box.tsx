import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

const WARNING_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 0L20 18H0L10 0Z"
      fill="#C53030"
      fillOpacity={1}
    />
    <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
      !
    </text>
  </svg>
);

interface FormErrorBoxProps {
  message: string;
  /** For top-of-form summary: list of specific problems (e.g. "Enter your First Name") */
  items?: string[];
}

export function FormErrorBox({ message, items }: FormErrorBoxProps) {
  return (
    <Box
      role="alert"
      display="flex"
      alignItems="flex-start"
      gap={3}
      py={3}
      px={4}
      borderRadius="6px"
      border="1px solid"
      borderColor="red.500"
      bg="red.50"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      <Box flexShrink={0} mt="2px" color="red.500" aria-hidden>
        {WARNING_ICON}
      </Box>
      <Box flex="1">
        <Text color="red.700" fontWeight={600} fontSize="14px" mb={items?.length ? 2 : 0}>
          {message}
        </Text>
        {items && items.length > 0 && (
          <VStack as="ul" align="stretch" gap={1} listStyleType="disc" pl={4} m={0} spacing={0}>
            {items.map((item, i) => (
              <Text as="li" key={i} color="red.700" fontSize="14px">
                {item}
              </Text>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
