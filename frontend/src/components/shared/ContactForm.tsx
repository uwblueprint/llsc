import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Grid, HStack, Input, Textarea, Text, VStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { submitContactForm } from '@/APIClients/contactAPIClient';
import { getUserData, UserDataResponse } from '@/APIClients/userDataAPIClient';
import { ContactSuccessModal } from './ContactSuccessModal';

interface ContactFormProps {
  redirectPath: string; // Where to redirect after success (e.g., '/participant/dashboard' or '/volunteer/dashboard')
}

export function ContactForm({ redirectPath }: ContactFormProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData: UserDataResponse | null = await getUserData();
        if (userData) {
          const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');
          if (fullName) {
            setName(fullName);
          }
          if (userData.email) {
            setEmail(userData.email);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Continue without pre-filling if there's an error
      }
    };

    loadUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (response.success) {
        // Clear the message field
        setMessage('');
        // Show success modal
        setShowSuccessModal(true);
      } else {
        setError('Failed to send message. Please try again later.');
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(redirectPath);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push(redirectPath);
  };

  return (
    <>
      <Box maxW="900px" mx="auto" p={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <VStack spacing={2} align="start">
            <Text
              fontSize="36px"
              fontWeight={600}
              color="#181D27"
              fontFamily="'Open Sans', sans-serif"
            >
              Get in touch!
            </Text>
            <Text
              fontSize="16px"
              fontWeight={400}
              color="#535862"
              fontFamily="'Open Sans', sans-serif"
            >
              Any questions? Fill out this contact form and a staff member will get back to you as
              soon as possible.
            </Text>
          </VStack>

          {/* Error Message */}
          {error && (
            <Box bg="#FEF2F2" border="1px solid #FCA5A5" borderRadius="8px" p={4}>
              <Text color="#DC2626" fontSize="14px" fontFamily="'Open Sans', sans-serif">
                {error}
              </Text>
            </Box>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <VStack gap={6} align="stretch">
              {/* Personal details section */}
              <Box>
                <Text
                  fontSize="26px"
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  mb={4}
                >
                  Personal details
                </Text>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  {/* Name field */}
                  <Field
                    label={
                      <Text
                        fontSize="18px"
                        fontWeight={600}
                        color="#1D3448"
                        fontFamily="'Open Sans', sans-serif"
                        mb={2}
                      >
                        Name
                      </Text>
                    }
                  >
                    <InputGroup>
                      <Input
                        value={name}
                        readOnly
                        placeholder="John Doe"
                        fontSize="16px"
                        fontFamily="'Open Sans', sans-serif"
                        bg="#F9FAFB"
                        borderColor="#D5D7DA"
                        color="#6B7280"
                        cursor="not-allowed"
                        _hover={{ borderColor: '#D5D7DA' }}
                        _focus={{ borderColor: '#D5D7DA', boxShadow: 'none' }}
                      />
                    </InputGroup>
                  </Field>

                  {/* Email field */}
                  <Field
                    label={
                      <Text
                        fontSize="18px"
                        fontWeight={600}
                        color="#1D3448"
                        fontFamily="'Open Sans', sans-serif"
                        mb={2}
                      >
                        Email Address
                      </Text>
                    }
                  >
                    <InputGroup>
                      <Input
                        type="email"
                        value={email}
                        readOnly
                        placeholder="john@llsc.ca"
                        fontSize="16px"
                        fontFamily="'Open Sans', sans-serif"
                        bg="#F9FAFB"
                        borderColor="#D5D7DA"
                        color="#6B7280"
                        cursor="not-allowed"
                        width="100%"
                        minWidth="250px"
                        _hover={{ borderColor: '#D5D7DA' }}
                        _focus={{ borderColor: '#D5D7DA', boxShadow: 'none' }}
                      />
                    </InputGroup>
                  </Field>
                </Grid>
              </Box>

              {/* Message section */}
              <Box>
                <Text
                  fontSize="26px"
                  fontWeight={600}
                  color="#1D3448"
                  fontFamily="'Open Sans', sans-serif"
                  mb={4}
                >
                  Message
                </Text>

                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  fontSize="16px"
                  fontFamily="'Open Sans', sans-serif"
                  bg="white"
                  border="1px solid"
                  borderColor="#D5D7DA"
                  borderRadius="8px"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  px={3}
                  py={3}
                  _placeholder={{ color: '#9ca3af' }}
                  _hover={{ borderColor: '#9CA0A6' }}
                  _focus={{ borderColor: '#056067', boxShadow: '0 0 0 3px rgba(5, 96, 103, 0.2)' }}
                  minH="200px"
                  resize="vertical"
                  required
                />
              </Box>

              {/* Action buttons */}
              <HStack gap={3} justify="flex-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  fontSize="18px"
                  fontWeight={600}
                  fontFamily="'Open Sans', sans-serif"
                  px="28px"
                  py="16px"
                  h="auto"
                  borderRadius="8px"
                  borderColor="transparent"
                  color="#495D6C"
                  bg="rgba(179, 206, 209, 0.3)"
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: 'rgba(179, 206, 209, 0.4)' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  bg="#056067"
                  color="white"
                  fontSize="18px"
                  fontWeight={600}
                  fontFamily="'Open Sans', sans-serif"
                  px="28px"
                  py="16px"
                  h="auto"
                  borderRadius="8px"
                  border="1px solid #056067"
                  boxShadow="0px 1px 2px 0px rgba(10, 13, 18, 0.05)"
                  _hover={{ bg: '#044d52' }}
                  _active={{ bg: '#033a3e' }}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Send message
                </Button>
              </HStack>
            </VStack>
          </form>
        </VStack>
      </Box>

      {/* Success Modal */}
      <ContactSuccessModal isOpen={showSuccessModal} onClose={handleSuccessModalClose} />
    </>
  );
}
