import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { Match } from '@/types/matchTypes';
import { Avatar } from '@/components/ui/avatar';

interface VolunteerCardProps {
  match: Match;
  onSchedule?: (matchId: number) => void;
}

export function VolunteerCard({ match, onSchedule }: VolunteerCardProps) {
  const { volunteer } = match;

  // Get initials from first and last name
  const getInitials = () => {
    const first = volunteer.firstName?.[0] || '';
    const last = volunteer.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  // Format pronouns for display
  const pronounsText = volunteer.pronouns && volunteer.pronouns.length > 0
    ? volunteer.pronouns.join('/')
    : null;

  // Format timezone (remove underscores, capitalize)
  const formatTimezone = (tz: string) => {
    return tz.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get volunteer timezone or use placeholder
  const volunteerTimezone = volunteer.timezone 
    ? formatTimezone(volunteer.timezone)
    : 'TBD';

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#E2E8F0"
      borderRadius="7px"
      p={6}
      boxShadow="0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)"
    >
      <VStack align="stretch" gap={4}>
        {/* Header with avatar, name, and info badges */}
        <Flex gap={4} align="flex-start">
          {/* Avatar */}
          <Flex
            w="60px"
            h="60px"
            bg="rgba(179, 206, 209, 0.3)"
            borderRadius="full"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Text fontSize="xl" fontWeight="medium" color="#056067">
              {getInitials()}
            </Text>
          </Flex>

          {/* Name, pronouns, and info badges */}
          <VStack align="stretch" gap={3} flex={1}>
            {/* Name and pronouns */}
            <Flex gap={2} align="baseline" flexWrap="wrap">
              <Text fontSize="lg" fontWeight="600" color="#1F2937">
                {volunteer.firstName} {volunteer.lastName}
              </Text>
              {pronounsText && (
                <Text fontSize="sm" color="#6B7280">
                  {pronounsText}
                </Text>
              )}
            </Flex>

            {/* Info badges */}
            <Flex gap={2} flexWrap="wrap">
              {typeof volunteer.age === 'number' && (
                <Box
                  bg="#B3CED14D"
                  px={3}
                  py={1.5}
                  borderRadius="14px"
                  fontSize="sm"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                >
                  <Text color="#3538CD" fontWeight="500">
                    👤 Current Age: {volunteer.age}
                  </Text>
                </Box>
              )}
              <Box
                bg="#B3CED14D"
                px={3}
                py={1.5}
                borderRadius="14px"
                fontSize="sm"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <Text color="#3538CD" fontWeight="500">
                  🕐 Time Zone: {volunteerTimezone}
                </Text>
              </Box>
              {volunteer.diagnosis && (
                <Box
                  bg="#B3CED14D"
                  px={3}
                  py={1.5}
                  borderRadius="14px"
                  fontSize="sm"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                >
                  <Text color="#3538CD" fontWeight="500">
                    🎗️ {volunteer.diagnosis}
                  </Text>
                </Box>
              )}
            </Flex>
          </VStack>
        </Flex>

        {/* Overview Section */}
        <Box>
          <Text fontSize="md" fontWeight="600" mb={2} color="#1F2937">
            Overview
          </Text>
          <Text fontSize="sm" color="#6B7280" lineHeight="1.5">
            My journey with blood cancer started when I was about twelve years old and getting
            treatment for the first time was extremely stress-inducing. My journey with blood
            cancer started when I was about twelve years old and getting treatment for the first
            time was extremely stress-inducing.
          </Text>
        </Box>

        {/* Treatment Information Section */}
        {volunteer.treatments.length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="600" mb={2} color="#1F2937">
              Treatment Information
            </Text>
            <Flex gap={2} flexWrap="wrap">
              {volunteer.treatments.map((treatment) => (
                <Box
                  key={treatment}
                  bg="#EEF4FF"
                  px={3}
                  py={1.5}
                  borderRadius="14px"
                  fontSize="sm"
                >
                  <Text color="#3538CD" fontWeight="500">
                    {treatment}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Box>
        )}

        {/* Experience Information Section */}
        {volunteer.experiences.length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="600" mb={2} color="#1F2937">
              Experience Information
            </Text>
            <Flex gap={2} flexWrap="wrap">
              {volunteer.experiences.map((experience) => (
                <Box
                  key={experience}
                  bg="#FDF2FA"
                  px={3}
                  py={1.5}
                  borderRadius="14px"
                  fontSize="sm"
                >
                  <Text color="#C11574" fontWeight="500">
                    {experience}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Box>
        )}

        {/* Schedule call button */}
        {onSchedule && (
          <Flex justify="flex-end" mt={2}>
            <Button
              bg="#056067"
              color="white"
              px={6}
              py={2.5}
              borderRadius="7px"
              fontWeight="600"
              fontSize="md"
              _hover={{ bg: '#044d52' }}
              onClick={() => onSchedule(match.id)}
            >
              Schedule call
            </Button>
          </Flex>
        )}
      </VStack>
    </Box>
  );
}

