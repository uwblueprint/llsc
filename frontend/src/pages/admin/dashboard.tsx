import React from 'react';
import Image from 'next/image';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { UserRole } from '@/types/authTypes';

const veniceBlue = '#1d3448';

export default function AdminDashboard() {
  return (
    <ProtectedPage allowedRoles={[UserRole.ADMIN]}>
      <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
        {/* Left: Dashboard Content */}
        <Flex
          flex="1"
          align="center"
          justify="center"
          px={{ base: 4, md: 12 }}
          py={{ base: 16, md: 0 }}
          bg="white"
          minH={{ base: '60vh', md: '100vh' }}
        >
          <Box w="full" maxW="520px">
            <Heading
              as="h1"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              color={veniceBlue}
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              lineHeight="50px"
              mb={2}
            >
              Admin Portal - First Connection Peer Support Program
            </Heading>
            <Heading
              as="h2"
              fontFamily="'Open Sans', sans-serif"
              fontWeight={600}
              color={veniceBlue}
              fontSize={{ base: 'xl', md: '2xl' }}
              mb={6}
              mt={8}
            >
              You've logged in!
            </Heading>
            <Text
              mb={8}
              color={veniceBlue}
              fontFamily="'Open Sans', sans-serif"
              fontWeight={400}
              fontSize="lg"
            >
              Welcome to the admin dashboard. You have successfully logged in to your administrator account.
            </Text>
          </Box>
        </Flex>
        {/* Right: Image */}
        <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
          <Image
            src="/admin.png"
            alt="Admin Portal Visual"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover', objectPosition: '90% 50%' }}
            priority
          />
        </Box>
      </Flex>
    </ProtectedPage>
  );
}
