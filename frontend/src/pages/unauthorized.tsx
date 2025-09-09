import React from 'react';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';

const veniceBlue = '#1d3448';
const teal = '#056067';

export default function Unauthorized() {
  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Box textAlign="center" py={10} px={6}>
        <Heading
          as="h1"
          size="4xl"
          bgGradient={`linear(to-r, ${teal}, ${veniceBlue})`}
          bgClip="text"
          mb={4}
        >
          403
        </Heading>

        <Heading as="h2" size="xl" mt={6} mb={2} color={veniceBlue}>
          Access Denied
        </Heading>

        <Text color="gray.500" mb={8} fontSize="lg">
          You don&apos;t have permission to access this page.
          <br />
          Please contact your administrator if you believe this is an error.
        </Text>

        <Link href="/" passHref>
          <Button
            colorScheme="teal"
            bg={teal}
            color="white"
            size="lg"
            _hover={{
              bg: veniceBlue,
            }}
          >
            Go to Home Page
          </Button>
        </Link>
      </Box>
    </Flex>
  );
}
