import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Button, Input, VStack, HStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { CustomRadio } from '@/components/CustomRadio';

const veniceBlue = '#1d3448';
const fieldGray = '#6b7280';
const teal = '#0d7377';
const lightTeal = '#e6f7f7';
const lightGray = '#f3f4f6';
const progressTeal = '#5eead4';
const progressGray = '#d1d5db';

export default function IntakePage() {
  const [formData, setFormData] = useState({
    hasBloodCancer: 'no',
    caringForSomeone: 'yes',
    caringFor: 'spouse',
    otherCaringFor: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    postalCode: '',
    city: '',
    province: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Flex minH="100vh" bg={lightGray} justify="center" py={12}>
      <Box
        w="full"
        maxW="840px"
        bg="white"
        borderRadius="8px"
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        p={10}
      >
        {/* Header */}
        <Heading
          as="h1"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={veniceBlue}
          fontSize="28px"
          mb={8}
        >
          First Connection Participant Form
        </Heading>

        {/* Progress Bar */}
        <Box mb={10}>
          <HStack gap={3}>
            <Box flex="1">
              <Box h="3px" bg={teal} borderRadius="full" />
            </Box>
            <Box flex="1">
              <Box h="3px" bg={progressGray} borderRadius="full" />
            </Box>
            <Box flex="1">
              <Box h="3px" bg={progressGray} borderRadius="full" />
            </Box>
          </HStack>
        </Box>

        {/* Experience Type Section */}
        <Box mb={12}>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={veniceBlue}
            fontSize="20px"
            mb={3}
          >
            Experience Type
          </Heading>
          <Text color={fieldGray} fontFamily="system-ui, -apple-system, sans-serif" fontSize="15px" mb={8}>
            Help us learn more about your experience with cancer.
          </Text>

          <VStack align="start" gap={8}>
            {/* Blood Cancer and Caring Questions - Side by Side */}
            <HStack align="start" gap={12} w="full">
              {/* Blood Cancer Question */}
              <Box flex="1">
                <Text
                  color={veniceBlue}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
                  fontSize="14px"
                  mb={4}
                >
                  Do you have blood cancer?
                </Text>
                <CustomRadio
                  name="hasBloodCancer"
                  value="yes"
                  checked={formData.hasBloodCancer === 'yes'}
                  onChange={(value) => handleInputChange('hasBloodCancer', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                    Yes
                  </Text>
                </CustomRadio>
                <CustomRadio
                  name="hasBloodCancer"
                  value="no"
                  checked={formData.hasBloodCancer === 'no'}
                  onChange={(value) => handleInputChange('hasBloodCancer', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                    No
                  </Text>
                </CustomRadio>
              </Box>

              {/* Caring for Someone Question */}
              <Box flex="1">
                <Text
                  color={veniceBlue}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
                  fontSize="14px"
                  mb={4}
                >
                  Are you caring for anyone with blood cancer?
                </Text>
                <CustomRadio
                  name="caringForSomeone"
                  value="yes"
                  checked={formData.caringForSomeone === 'yes'}
                  onChange={(value) => handleInputChange('caringForSomeone', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                    Yes
                  </Text>
                </CustomRadio>
                <CustomRadio
                  name="caringForSomeone"
                  value="no"
                  checked={formData.caringForSomeone === 'no'}
                  onChange={(value) => handleInputChange('caringForSomeone', value)}
                >
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                    No
                  </Text>
                </CustomRadio>
              </Box>
            </HStack>

            {/* Who are you caring for */}
            <Box w="full">
              <Text
                color={veniceBlue}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
                fontSize="14px"
                mb={4}
              >
                Who are you caring for?
              </Text>
              <CustomRadio
                name="caringFor"
                value="parent"
                checked={formData.caringFor === 'parent'}
                onChange={(value) => handleInputChange('caringFor', value)}
              >
                <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                  A parent
                </Text>
              </CustomRadio>
              <CustomRadio
                name="caringFor"
                value="sibling"
                checked={formData.caringFor === 'sibling'}
                onChange={(value) => handleInputChange('caringFor', value)}
              >
                <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                  A sibling
                </Text>
              </CustomRadio>
              <CustomRadio
                name="caringFor"
                value="child"
                checked={formData.caringFor === 'child'}
                onChange={(value) => handleInputChange('caringFor', value)}
              >
                <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                  A child
                </Text>
              </CustomRadio>
              <CustomRadio
                name="caringFor"
                value="spouse"
                checked={formData.caringFor === 'spouse'}
                onChange={(value) => handleInputChange('caringFor', value)}
              >
                <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                  A spouse
                </Text>
              </CustomRadio>
              <CustomRadio
                name="caringFor"
                value="friend"
                checked={formData.caringFor === 'friend'}
                onChange={(value) => handleInputChange('caringFor', value)}
              >
                <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                  A friend
                </Text>
              </CustomRadio>
              <CustomRadio
                name="caringFor"
                value="other"
                checked={formData.caringFor === 'other'}
                onChange={(value) => handleInputChange('caringFor', value)}
              >
                <HStack align="center" gap={2}>
                  <Text fontFamily="system-ui, -apple-system, sans-serif" fontSize="14px" color={veniceBlue}>
                    Other:
                  </Text>
                  {formData.caringFor === 'other' && (
                    <Box w="280px">
                      <InputGroup>
                        <Input
                          placeholder="olivia@untitledui.com"
                          value={formData.otherCaringFor}
                          onChange={(e) => handleInputChange('otherCaringFor', e.target.value)}
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontSize="14px"
                          color={veniceBlue}
                          borderColor="#d1d5db"
                          borderRadius="6px"
                          h="36px"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                        />
                      </InputGroup>
                    </Box>
                  )}
                </HStack>
              </CustomRadio>
            </Box>
          </VStack>
        </Box>

        {/* Personal Information Section */}
        <Box mb={10}>
          <Heading
            as="h2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={600}
            color={veniceBlue}
            fontSize="20px"
            mb={3}
          >
            Personal Information
          </Heading>
          <Text color={fieldGray} fontFamily="system-ui, -apple-system, sans-serif" fontSize="15px" mb={8}>
            Please provide your contact details and address.
          </Text>

          <VStack gap={5}>
            {/* Name Fields */}
            <HStack gap={4} w="full">
              <Field
                label={
                  <Text
                    color={veniceBlue}
                    fontWeight={500}
                    fontSize="14px"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    mb={1}
                  >
                    First Name
                  </Text>
                }
                flex="1"
              >
                <InputGroup>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                  />
                </InputGroup>
              </Field>
              <Field
                label={
                  <Text
                    color={veniceBlue}
                    fontWeight={500}
                    fontSize="14px"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    mb={1}
                  >
                    Last Name
                  </Text>
                }
                flex="1"
              >
                <InputGroup>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                  />
                </InputGroup>
              </Field>
            </HStack>

            {/* Date of Birth and Phone */}
            <HStack gap={4} w="full">
              <Field
                label={
                  <Text
                    color={veniceBlue}
                    fontWeight={500}
                    fontSize="14px"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    mb={1}
                  >
                    Date of Birth
                  </Text>
                }
                flex="1"
              >
                <InputGroup>
                  <Input
                    placeholder="DD/MM/YYYY"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                  />
                </InputGroup>
              </Field>
              <Field
                label={
                  <Text
                    color={veniceBlue}
                    fontWeight={500}
                    fontSize="14px"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    mb={1}
                  >
                    Phone Number
                  </Text>
                }
                flex="1"
              >
                <InputGroup>
                  <Input
                    placeholder="###-###-####"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                  />
                </InputGroup>
              </Field>
            </HStack>

            {/* Postal Code and City */}
            <HStack gap={4} w="full">
              <Field
                label={
                  <Text
                    color={veniceBlue}
                    fontWeight={500}
                    fontSize="14px"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    mb={1}
                  >
                    Postal Code
                  </Text>
                }
                flex="1"
              >
                <InputGroup>
                  <Input
                    placeholder="ZIP Code"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                  />
                </InputGroup>
              </Field>
              <Field
                label={
                  <Text
                    color={veniceBlue}
                    fontWeight={500}
                    fontSize="14px"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    mb={1}
                  >
                    City
                  </Text>
                }
                flex="1"
              >
                <InputGroup>
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14px"
                    color={veniceBlue}
                    borderColor="#d1d5db"
                    borderRadius="6px"
                    h="40px"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                  />
                </InputGroup>
              </Field>
            </HStack>

            {/* Province */}
            <Field
              label={
                <Text
                  color={veniceBlue}
                  fontWeight={500}
                  fontSize="14px"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  mb={1}
                >
                  Province
                </Text>
              }
              w="full"
            >
              <InputGroup>
                <Input
                  placeholder="Province"
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14px"
                  color={veniceBlue}
                  borderColor="#d1d5db"
                  borderRadius="6px"
                  h="40px"
                  _placeholder={{ color: '#9ca3af' }}
                  _focus={{ borderColor: teal, boxShadow: `0 0 0 3px ${teal}20` }}
                />
              </InputGroup>
            </Field>
          </VStack>
        </Box>

        {/* Next Section Button */}
        <Flex justify="flex-end" mt={10}>
          <Button
            bg={teal}
            color="white"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
            fontSize="14px"
            px={5}
            py={2.5}
            h="40px"
            borderRadius="6px"
            _hover={{ bg: '#0a5d61' }}
            transition="background-color 0.2s"
          >
            Next Section
            <Box as="span" fontSize="16px" ml={2}>
              →
            </Box>
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
