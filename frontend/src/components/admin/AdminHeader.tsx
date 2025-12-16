import React from 'react';
import Image from 'next/image';
import { Box, Flex } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiFolder, FiLoader, FiLogOut } from 'react-icons/fi';
import { LabelSmall } from '@/components/ui/text-styles';
import { COLORS, shadow } from '@/constants/colors';

export const AdminHeader: React.FC = () => {
  const router = useRouter();

  const handleTaskListClick = () => {
    router.push('/admin/tasks');
  };

  const handleProgressTrackerClick = () => {
    router.push('/admin/directory');
  };

  return (
    <Box
      w="full"
      bg={COLORS.white}
      borderBottom={`1px solid ${COLORS.grayBorder}`}
      boxShadow={shadow.header}
      px="24px"
      py="12px"
    >
      <Flex justify="space-between" align="center">
        {/* Organization Logo */}
        <Box position="relative" width="120px" height="48px">
          <Image
            src="/llsc-logo.png"
            alt="LLSC Logo"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>

        {/* Navigation Items */}
        <Flex align="center" gap="32px">
          <Flex
            align="center"
            gap="8px"
            cursor="pointer"
            onClick={handleTaskListClick}
            _hover={{ opacity: 0.7 }}
            transition="opacity 0.2s"
          >
            <FiFolder size="16px" color={COLORS.gray700} />
            <LabelSmall color={COLORS.gray700}>Task List</LabelSmall>
          </Flex>
          <Flex
            align="center"
            gap="8px"
            cursor="pointer"
            onClick={handleProgressTrackerClick}
            _hover={{ opacity: 0.7 }}
            transition="opacity 0.2s"
          >
            <FiLoader size="16px" color={COLORS.gray700} />
            <LabelSmall color={COLORS.gray700}>Progress Tracker</LabelSmall>
          </Flex>
          <Flex align="center" gap="8px" cursor="pointer">
            <FiLogOut size="16px" color={COLORS.gray700} />
            <LabelSmall color={COLORS.gray700}>Sign Out</LabelSmall>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};
