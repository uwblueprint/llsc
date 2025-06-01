import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Input } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { Radio, RadioGroup } from '@/components/ui/radio';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';

export function ParticipantFormPage() {
  const [signupType, setSignupType] = useState('volunteer');

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left: Participant Form */}
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
            First Connection Peer<br />Support Program
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
            Welcome to our application portal!
          </Heading>
          <Text
            mb={8}
            color={veniceBlue}
            fontFamily="'Open Sans', sans-serif"
            fontWeight={400}
            fontSize="lg"
          >
            Let&apos;s start by creating an account.
          </Text>
          <form>
            <Field
              label={<span style={{ color: fieldGray, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>Email</span>}
              mb={4}
            >
              <InputGroup w="100%">
                <Input
                  type="email"
                  placeholder="john.doe@gmail.com"
                  required
                  autoComplete="email"
                  w="100%"
                  maxW="518px"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize={14}
                  color={fieldGray}
                  bg="white"
                  borderColor="#D5D7DA"
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                />
              </InputGroup>
            </Field>
            <Field
              label={<span style={{ color: fieldGray, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>Password</span>}
              mb={4}
            >
              <InputGroup w="100%">
                <Input
                  type="password"
                  placeholder=""
                  required
                  autoComplete="new-password"
                  w="100%"
                  maxW="518px"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize={14}
                  color={fieldGray}
                  bg="white"
                  borderColor="#D5D7DA"
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                />
              </InputGroup>
            </Field>
            <Field
              label={<span style={{ color: fieldGray, fontWeight: 600, fontSize: 14, fontFamily: 'Open Sans, sans-serif' }}>Confirm Password</span>}
              mb={4}
            >
              <InputGroup w="100%">
                <Input
                  type="password"
                  placeholder=""
                  required
                  autoComplete="new-password"
                  w="100%"
                  maxW="518px"
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={400}
                  fontSize={14}
                  color={fieldGray}
                  bg="white"
                  borderColor="#D5D7DA"
                  _placeholder={{ color: '#A0AEC0', fontWeight: 400 }}
                />
              </InputGroup>
            </Field>
            <Text mt={2} mb={2} color={fieldGray} fontWeight={600} fontFamily="'Open Sans', sans-serif" fontSize={15}>
              I am signing up:
            </Text>
            <RadioGroup
              value={signupType}
              onValueChange={details => setSignupType(details.value)}
              mb={6}
            >
              <div className="radio-options-container" style={{ display: 'flex', flexDirection: 'row', gap: 40 }}>
                <Radio
                  value="volunteer"
                  style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 14, color: '#414651', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                  data-control-style={{ borderColor: '#A0AEC0', background: '#E2E8F0', width: 16, height: 16 }}
                >
                  As a Peer Support Volunteer
                </Radio>
                <Radio
                  value="request"
                  style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 14, color: '#414651', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                  data-control-style={{ borderColor: '#A0AEC0', background: '#E2E8F0', width: 16, height: 16 }}
                >
                  To Request Peer Support
                </Radio>
              </div>
            </RadioGroup>
            <Button
              type="submit"
              w="100%"
              maxW="518px"
              mt={2}
              size="lg"
              fontWeight={600}
              fontFamily="'Open Sans', sans-serif"
              fontSize="lg"
              bg={teal}
              color="white"
              borderRadius="8px"
              border="1px solid #056067"
              boxShadow="0 1px 2px 0 #0A0D12, 0 0 0 0 transparent"
              _hover={{ bg: '#044953' }}
              px={8}
              py={3}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              Continue <span style={{ fontSize: 22, marginLeft: 8 }}>&rarr;</span>
            </Button>
          </form>
          <Text mt={8} color={veniceBlue} fontSize="md" fontWeight={600} fontFamily="'Open Sans', sans-serif">
            Already have an account?{' '}
            <Link
              href="/"
              style={{ color: teal, textDecoration: 'underline', fontWeight: 600, fontFamily: 'Open Sans, sans-serif' }}
            >
              Sign in
            </Link>
          </Text>
        </Box>
      </Flex>
      {/* Right: Image */}
      <Box flex="1" display={{ base: 'none', md: 'block' }} position="relative" minH="100vh">
        <Image
          src="/login.png"
          alt="First Connection Peer Support"
          fill
          style={{ objectFit: 'cover', objectPosition: '90% 50%' }}
          priority
        />
      </Box>
    </Flex>
  );
}

export default function ParticipantFormPageWrapper() {
  return (
    <>
      <ParticipantFormPage />
      <style jsx global>{`
        .radio-options-container [data-part="control"] {
          border: 2px solid #A0AEC0 !important;
          background: #E2E8F0 !important;
          width: 16px !important;
          height: 16px !important;
          box-shadow: none !important;
        }
      `}</style>
    </>
  );
} 