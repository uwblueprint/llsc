import React from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import { FiHeart, FiInfo } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@/components/ui/tooltip';
import { COLORS } from '@/constants/form';

interface ReadOnlyDiagnosisFieldProps {
  label: string;
  value: string;
  showHeartIcon?: boolean;
  fullWidth?: boolean;
}

const ReadOnlyDiagnosisField: React.FC<ReadOnlyDiagnosisFieldProps> = ({
  label,
  value,
  showHeartIcon = false,
  fullWidth = false,
}) => {
  const t = useTranslations('dashboard');

  return (
    <Box flex="1">
      {showHeartIcon ? (
        <Flex align="center" gap={2} mb={2}>
          <FiHeart size={14} color={COLORS.veniceBlue} />
          <Text
            fontSize="1rem"
            fontWeight={600}
            lineHeight="30px"
            color={COLORS.veniceBlue}
            fontFamily="'Open Sans', sans-serif"
          >
            {label}
          </Text>
        </Flex>
      ) : (
        <Text
          fontSize="1rem"
          fontWeight={600}
          lineHeight="30px"
          letterSpacing="0%"
          color={COLORS.veniceBlue}
          fontFamily="'Open Sans', sans-serif"
          mb={2}
        >
          {label}
        </Text>
      )}
      <Box
        bg="white"
        borderColor="#D5D7DA"
        border="1px solid #D5D7DA"
        borderRadius="8px"
        height="44px"
        paddingLeft="14px"
        paddingRight="12px"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        width={fullWidth ? '100%' : undefined}
      >
        <Box
          as="span"
          fontSize="1rem"
          fontWeight={400}
          lineHeight="24px"
          color="#181D27"
          fontFamily="'Open Sans', sans-serif"
          opacity={0.6}
          flex={1}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {value || t('notProvided')}
        </Box>
        <Tooltip content={t('forAccuracyLocked')} showArrow>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <FiInfo size={20} color="#495D6C" />
          </button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ReadOnlyDiagnosisField;
