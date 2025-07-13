import React from 'react';
import Image from 'next/image';
import { Box, Flex, Heading, Text, Link } from '@chakra-ui/react';

const veniceBlue = '#1d3448';

export default function AdminDashboard() {
  return (
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
            Welcome!
          </Heading>
          <Text
            mb={8}
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            We sent a confirmation link to <b>john.doe@gmail.com</b>
          </Text>
          <Text color={veniceBlue} fontFamily="'Open Sans', sans-serif" fontWeight={400} fontSize="md">
            Didn&apos;t get a link?{' '}
            <Link href="/admin-login" style={{ color: '#056067', textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}>
              Click here to resend.
            </Link>
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
  );
} 