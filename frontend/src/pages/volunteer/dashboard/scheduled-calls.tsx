import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
} from '@chakra-ui/react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import ProfileCard from '../../../components/ProfileCard';

interface ScheduledCall {
  id: number;
  name: string;
  pronouns: string;
  age: number;
  timezone: string;
  diagnosis: string;
  treatments: string[];
  initials: string;
  time: string;
}

interface DaySchedule {
  date: string;
  label: string;
  calls: ScheduledCall[];
}



const ScheduledCalls: React.FC = () => {
  const scheduledCalls: DaySchedule[] = [
    {
      date: "Feb 26",
      label: "Today",
      calls: [
        {
          id: 1,
          name: 'Jane Doe',
          pronouns: 'she/her',
          age: 24,
          timezone: 'EST',
          diagnosis: 'Lymphoma',
          treatments: ['First-line therapy', 'Targeted therapy', 'Stem cell transplant'],
          initials: 'JD',
          time: '12:00PM'
        },
        {
          id: 2,
          name: 'Jane Doe',
          pronouns: 'she/her',
          age: 24,
          timezone: 'EST',
          diagnosis: 'Lymphoma',
          treatments: ['First-line therapy', 'Targeted therapy', 'Stem cell transplant'],
          initials: 'JD',
          time: '12:00PM'
        }
      ]
    },
    {
      date: "Feb 27",
      label: "Tomorrow",
      calls: [
        {
          id: 3,
          name: 'Jane Doe',
          pronouns: 'she/her',
          age: 24,
          timezone: 'EST',
          diagnosis: 'Lymphoma',
          treatments: ['First-line therapy', 'Targeted therapy', 'Stem cell transplant'],
          initials: 'JD',
          time: '12:00PM'
        }
      ]
    },
    {
      date: "Feb 28",
      label: "Friday",
      calls: [
        {
          id: 4,
          name: 'Jane Doe',
          pronouns: 'she/her',
          age: 24,
          timezone: 'EST',
          diagnosis: 'Lymphoma',
          treatments: ['First-line therapy', 'Targeted therapy', 'Stem cell transplant'],
          initials: 'JD',
          time: '12:00PM'
        }
      ]
    }
  ];

  return (
    <DashboardLayout>
      <Box display="flex" justifyContent="center" w="100%">
        <Box w="711px">
          <Heading 
            fontSize="2.25rem"
            fontWeight={600}
            lineHeight="100%"
            letterSpacing="-1.5%"
            color="#1D3448"
            fontFamily="'Open Sans', sans-serif"
            textAlign="left"
            mb={6}
            mt={0}
          >
            Scheduled Calls
          </Heading>

          <VStack gap="100px" align="flex-start">
            {scheduledCalls.map((day) => (
              <Box key={day.date} w="100%">
                <HStack gap="12px" mb={4}>
                  <Text 
                    fontSize="1.25rem"
                    fontWeight={600}
                    color="#056067"
                    fontFamily="'Open Sans', sans-serif"
                    lineHeight="1.25rem"
                    letterSpacing="0%"
                  >
                    {day.date}
                  </Text>
                  <Text 
                    fontSize="1.125rem"
                    fontWeight={400}
                    color="#056067"
                    fontFamily="'Open Sans', sans-serif"
                    lineHeight="1.25rem"
                    letterSpacing="0%"
                  >
                    {day.label}
                  </Text>
                </HStack>

                <VStack gap={4} align="flex-start">
                  {day.calls.map((call) => {
                    // Convert time string to Date object for today's date
                    const timeDate = new Date();
                    const [time, period] = call.time.split(/(\d{1,2}:\d{2})(AM|PM)/i).filter(Boolean);
                    const [hours, minutes] = time.split(':').map(Number);
                    const adjustedHours = period.toUpperCase() === 'PM' && hours !== 12 ? hours + 12 : 
                                        period.toUpperCase() === 'AM' && hours === 12 ? 0 : hours;
                    timeDate.setHours(adjustedHours, minutes, 0, 0);
                    
                    return (
                      <ProfileCard
                        key={call.id}
                        participant={call}
                        time={timeDate}
                        showTimes={true}
                        onViewContact={() => {
                          console.log('View contact details for', call.name);
                        }}
                      />
                    );
                  })}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default ScheduledCalls; 