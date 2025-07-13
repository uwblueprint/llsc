import React from 'react';
import { Box, Flex, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { COLORS } from '@/constants/form';

export default function HomePage() {
  const router = useRouter();

  return (
    <Flex minH="100vh" bg={COLORS.lightGray} justify="center" alignItems="center" py={12}>
      <Box
        w="full"
        maxW="600px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={12}
        textAlign="center"
      >
        <VStack gap={8}>
          <Heading
            as="h1"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={COLORS.veniceBlue}
            fontSize="32px"
          >
            First Connection
          </Heading>

          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16px"
            color={COLORS.fieldGray}
            lineHeight="1.6"
          >
            Choose your intake form type to get started
          </Text>

          <VStack gap={4} w="full" maxW="400px">
            <Button
              onClick={() => router.push('/participant/intake')}
              bg={COLORS.teal}
              color="white"
              _hover={{ bg: COLORS.teal, opacity: 0.9 }}
              _active={{ bg: COLORS.teal }}
              w="full"
              h="50px"
              fontSize="16px"
              fontWeight={500}
            >
              Participant Intake Form
            </Button>

            <Button
              onClick={() => router.push('/volunteer/intake')}
              bg={COLORS.veniceBlue}
              color="white"
              _hover={{ bg: COLORS.veniceBlue, opacity: 0.9 }}
              _active={{ bg: COLORS.veniceBlue }}
              w="full"
              h="50px"
              fontSize="16px"
              fontWeight={500}
            >
              Volunteer Intake Form
            </Button>
          </VStack>

          <Text
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14px"
            color={COLORS.fieldGray}
            mt={4}
          >
            The form will adapt based on your selections about blood cancer experience and
            caregiving status.
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
