import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { FormStatusGuard } from '@/components/auth/FormStatusGuard';
import { CheckMarkIcon } from '@/components/ui';
import { COLORS } from '@/constants/form';
import { FormStatus, UserRole } from '@/types/authTypes';

export default function VolunteerSecondaryApplicationThankYouPage() {
  return (
    <ProtectedPage allowedRoles={[UserRole.VOLUNTEER, UserRole.ADMIN]}>
      <FormStatusGuard allowedStatuses={[FormStatus.SECONDARY_APPLICATION_SUBMITTED]}>
        <Flex minH="100vh" bg={COLORS.lightGray} justify="center" py={12}>
          <Box
            w="full"
            maxW="800px"
            bg="white"
            borderRadius="8px"
            boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
            p={12}
            textAlign="center"
          >
            <VStack gap={6}>
              <CheckMarkIcon />

              <Heading
                as="h1"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={600}
                color={COLORS.veniceBlue}
                fontSize="32px"
                mb={2}
              >
                Success!
              </Heading>
              <Heading
                as="h1"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={600}
                color={COLORS.veniceBlue}
                fontSize="32px"
                mb={4}
              >
                Thank you for sharing your references and experiences with us.
              </Heading>

              <Text
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="16px"
                color={COLORS.fieldGray}
                lineHeight="1.6"
                maxW="600px"
                textAlign="center"
              >
                We will reach out in the next 5-7 business days with the next steps. For immediate
                help, please reach us at{' '}
                <Text as="span" color={COLORS.teal} fontWeight={500}>
                  FirstConnections@lls.org
                </Text>
                . Please note LLSC&apos;s working days are Monday-Thursday.
              </Text>
            </VStack>
          </Box>
        </Flex>
      </FormStatusGuard>
    </ProtectedPage>
  );
}
