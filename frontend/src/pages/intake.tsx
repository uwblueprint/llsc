import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Button, Input, VStack, HStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { Radio, RadioGroup } from '@/components/ui/radio';
import { Checkbox } from '@/components/ui/checkbox';

const veniceBlue = '#1d3448';
const fieldGray = '#414651';
const teal = '#056067';
const lightGray = '#f7f8fa';
const progressTeal = '#4a9b9f';

export default function IntakePage() {
  const [formData, setFormData] = useState({
    hasBloodCancer: '',
    caringForSomeone: '',
    caringFor: '',
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
    <Flex minH="100vh" bg={lightGray} justify="center" py={8}>
      <Box
        w="full"
        maxW="800px"
        bg="white"
        borderRadius="12px"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        p={8}
      >
        {/* Header */}
        <Heading
          as="h1"
          fontFamily="'Open Sans', sans-serif"
          fontWeight={600}
          color={veniceBlue}
          fontSize="2xl"
          mb={8}
        >
          First Connection Participant Form
        </Heading>

        {/* Progress Bar */}
        <Box mb={8}>
          <HStack gap={4} mb={4}>
            <Box flex="1">
              <Box h="4px" bg={progressTeal} borderRadius="2px" />
            </Box>
            <Box flex="1">
              <Box h="4px" bg="#e2e8f0" borderRadius="2px" />
            </Box>
            <Box flex="1">
              <Box h="4px" bg="#e2e8f0" borderRadius="2px" />
            </Box>
          </HStack>
        </Box>

        {/* Experience Type Section */}
        <Box mb={10}>
          <Heading
            as="h2"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            color={veniceBlue}
            fontSize="xl"
            mb={2}
          >
            Experience Type
          </Heading>
          <Text color={fieldGray} fontFamily="'Open Sans', sans-serif" fontSize="sm" mb={6}>
            Help us learn more about your experience with cancer.
          </Text>

          <VStack align="start" gap={6}>
            {/* Blood Cancer and Caring Questions - Side by Side */}
            <HStack align="start" gap={8} w="full">
              {/* Blood Cancer Question */}
              <Box flex="1">
                <Text
                  color={veniceBlue}
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={500}
                  fontSize="sm"
                  mb={3}
                >
                  Do you have blood cancer?
                </Text>
                <Box
                  css={{
                    '& [data-part="control"]': {
                      borderColor: '#d1d5db',
                    },
                    '& [data-part="control"][data-state="checked"]': {
                      backgroundColor: teal,
                      borderColor: teal,
                      color: 'white',
                    },
                  }}
                >
                  <RadioGroup
                    value={formData.hasBloodCancer}
                    onValueChange={(details) => handleInputChange('hasBloodCancer', details.value)}
                  >
                    <VStack align="start" gap={2}>
                      <Radio value="yes">
                        <Text fontFamily="'Open Sans', sans-serif" fontSize="sm">
                          Yes
                        </Text>
                      </Radio>
                      <Radio value="no">
                        <Text fontFamily="'Open Sans', sans-serif" fontSize="sm">
                          No
                        </Text>
                      </Radio>
                    </VStack>
                  </RadioGroup>
                </Box>
              </Box>

              {/* Caring for Someone Question */}
              <Box flex="1">
                <Text
                  color={veniceBlue}
                  fontFamily="'Open Sans', sans-serif"
                  fontWeight={500}
                  fontSize="sm"
                  mb={3}
                >
                  Are you caring for anyone with blood cancer?
                </Text>
                <Box
                  css={{
                    '& [data-part="control"]': {
                      borderColor: '#d1d5db',
                    },
                    '& [data-part="control"][data-state="checked"]': {
                      backgroundColor: teal,
                      borderColor: teal,
                      color: 'white',
                    },
                  }}
                >
                  <RadioGroup
                    value={formData.caringForSomeone}
                    onValueChange={(details) =>
                      handleInputChange('caringForSomeone', details.value)
                    }
                  >
                    <VStack align="start" gap={2}>
                      <Radio value="yes">
                        <Text fontFamily="'Open Sans', sans-serif" fontSize="sm">
                          Yes
                        </Text>
                      </Radio>
                      <Radio value="no">
                        <Text fontFamily="'Open Sans', sans-serif" fontSize="sm">
                          No
                        </Text>
                      </Radio>
                    </VStack>
                  </RadioGroup>
                </Box>
              </Box>
            </HStack>

            {/* Who are you caring for */}
            <Box w="full">
              <Text
                color={veniceBlue}
                fontFamily="'Open Sans', sans-serif"
                fontWeight={500}
                fontSize="sm"
                mb={3}
              >
                Who are you caring for?
              </Text>
              <Box
                css={{
                  '& [data-part="control"]': {
                    borderColor: '#d1d5db',
                  },
                  '& [data-part="control"][data-state="checked"]': {
                    backgroundColor: teal,
                    borderColor: teal,
                    color: 'white',
                  },
                }}
              >
                <VStack align="start" gap={2}>
                  <Checkbox
                    checked={formData.caringFor.includes('parent')}
                    onCheckedChange={(checked) => {
                      const current = formData.caringFor.split(',').filter(Boolean);
                      if (checked) {
                        handleInputChange('caringFor', [...current, 'parent'].join(','));
                      } else {
                        handleInputChange(
                          'caringFor',
                          current.filter((item) => item !== 'parent').join(','),
                        );
                      }
                    }}
                  >
                    <Text fontFamily="'Open Sans', sans-serif" fontSize="sm" color={veniceBlue}>
                      A parent
                    </Text>
                  </Checkbox>
                  <Checkbox
                    checked={formData.caringFor.includes('sibling')}
                    onCheckedChange={(checked) => {
                      const current = formData.caringFor.split(',').filter(Boolean);
                      if (checked) {
                        handleInputChange('caringFor', [...current, 'sibling'].join(','));
                      } else {
                        handleInputChange(
                          'caringFor',
                          current.filter((item) => item !== 'sibling').join(','),
                        );
                      }
                    }}
                  >
                    <Text fontFamily="'Open Sans', sans-serif" fontSize="sm" color={veniceBlue}>
                      A sibling
                    </Text>
                  </Checkbox>
                  <Checkbox
                    checked={formData.caringFor.includes('child')}
                    onCheckedChange={(checked) => {
                      const current = formData.caringFor.split(',').filter(Boolean);
                      if (checked) {
                        handleInputChange('caringFor', [...current, 'child'].join(','));
                      } else {
                        handleInputChange(
                          'caringFor',
                          current.filter((item) => item !== 'child').join(','),
                        );
                      }
                    }}
                  >
                    <Text fontFamily="'Open Sans', sans-serif" fontSize="sm" color={veniceBlue}>
                      A child
                    </Text>
                  </Checkbox>
                  <Checkbox
                    checked={formData.caringFor.includes('spouse')}
                    onCheckedChange={(checked) => {
                      const current = formData.caringFor.split(',').filter(Boolean);
                      if (checked) {
                        handleInputChange('caringFor', [...current, 'spouse'].join(','));
                      } else {
                        handleInputChange(
                          'caringFor',
                          current.filter((item) => item !== 'spouse').join(','),
                        );
                      }
                    }}
                  >
                    <Text fontFamily="'Open Sans', sans-serif" fontSize="sm" color={veniceBlue}>
                      A spouse
                    </Text>
                  </Checkbox>
                  <Checkbox
                    checked={formData.caringFor.includes('friend')}
                    onCheckedChange={(checked) => {
                      const current = formData.caringFor.split(',').filter(Boolean);
                      if (checked) {
                        handleInputChange('caringFor', [...current, 'friend'].join(','));
                      } else {
                        handleInputChange(
                          'caringFor',
                          current.filter((item) => item !== 'friend').join(','),
                        );
                      }
                    }}
                  >
                    <Text fontFamily="'Open Sans', sans-serif" fontSize="sm" color={veniceBlue}>
                      A friend
                    </Text>
                  </Checkbox>
                  <Checkbox
                    checked={formData.caringFor.includes('other')}
                    onCheckedChange={(checked) => {
                      const current = formData.caringFor.split(',').filter(Boolean);
                      if (checked) {
                        handleInputChange('caringFor', [...current, 'other'].join(','));
                      } else {
                        handleInputChange(
                          'caringFor',
                          current.filter((item) => item !== 'other').join(','),
                        );
                      }
                    }}
                  >
                    <Text fontFamily="'Open Sans', sans-serif" fontSize="sm" color={veniceBlue}>
                      Other:
                    </Text>
                  </Checkbox>
                  {formData.caringFor.includes('other') && (
                    <Box ml={6} w="300px">
                      <InputGroup>
                        <Input
                          placeholder="olivia@sentineldu.com"
                          value={formData.otherCaringFor}
                          onChange={(e) => handleInputChange('otherCaringFor', e.target.value)}
                          fontFamily="'Open Sans', sans-serif"
                          fontSize="sm"
                          color={fieldGray}
                        />
                      </InputGroup>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Box>
          </VStack>
        </Box>

        {/* Personal Information Section */}
        <Box mb={8}>
          <Heading
            as="h2"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            color={veniceBlue}
            fontSize="xl"
            mb={2}
          >
            Personal Information
          </Heading>
          <Text color={fieldGray} fontFamily="'Open Sans', sans-serif" fontSize="sm" mb={6}>
            Please provide your contact details and address.
          </Text>

          <VStack gap={6}>
            {/* Name Fields */}
            <HStack gap={4} w="full">
              <Field
                label={
                  <Text
                    color={fieldGray}
                    fontWeight={600}
                    fontSize="sm"
                    fontFamily="'Open Sans', sans-serif"
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
                    fontFamily="'Open Sans', sans-serif"
                    fontSize="sm"
                    color={fieldGray}
                  />
                </InputGroup>
              </Field>
              <Field
                label={
                  <Text
                    color={fieldGray}
                    fontWeight={600}
                    fontSize="sm"
                    fontFamily="'Open Sans', sans-serif"
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
                    fontFamily="'Open Sans', sans-serif"
                    fontSize="sm"
                    color={fieldGray}
                  />
                </InputGroup>
              </Field>
            </HStack>

            {/* Date of Birth and Phone */}
            <HStack gap={4} w="full">
              <Field
                label={
                  <Text
                    color={fieldGray}
                    fontWeight={600}
                    fontSize="sm"
                    fontFamily="'Open Sans', sans-serif"
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
                    fontFamily="'Open Sans', sans-serif"
                    fontSize="sm"
                    color={fieldGray}
                  />
                </InputGroup>
              </Field>
              <Field
                label={
                  <Text
                    color={fieldGray}
                    fontWeight={600}
                    fontSize="sm"
                    fontFamily="'Open Sans', sans-serif"
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
                    fontFamily="'Open Sans', sans-serif"
                    fontSize="sm"
                    color={fieldGray}
                  />
                </InputGroup>
              </Field>
            </HStack>

            {/* Postal Code and City */}
            <HStack gap={4} w="full">
              <Field
                label={
                  <Text
                    color={fieldGray}
                    fontWeight={600}
                    fontSize="sm"
                    fontFamily="'Open Sans', sans-serif"
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
                    fontFamily="'Open Sans', sans-serif"
                    fontSize="sm"
                    color={fieldGray}
                  />
                </InputGroup>
              </Field>
              <Field
                label={
                  <Text
                    color={fieldGray}
                    fontWeight={600}
                    fontSize="sm"
                    fontFamily="'Open Sans', sans-serif"
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
                    fontFamily="'Open Sans', sans-serif"
                    fontSize="sm"
                    color={fieldGray}
                  />
                </InputGroup>
              </Field>
            </HStack>

            {/* Province */}
            <Field
              label={
                <Text
                  color={fieldGray}
                  fontWeight={600}
                  fontSize="sm"
                  fontFamily="'Open Sans', sans-serif"
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
                  fontFamily="'Open Sans', sans-serif"
                  fontSize="sm"
                  color={fieldGray}
                />
              </InputGroup>
            </Field>
          </VStack>
        </Box>

        {/* Next Section Button */}
        <Flex justify="flex-end" mt={8}>
          <Button
            bg={teal}
            color="white"
            fontFamily="'Open Sans', sans-serif"
            fontWeight={600}
            fontSize="sm"
            px={6}
            py={3}
            borderRadius="8px"
            _hover={{ bg: '#044953' }}
          >
            Next Section
            <Box as="span" fontSize="lg" ml={2}>
              →
            </Box>
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
