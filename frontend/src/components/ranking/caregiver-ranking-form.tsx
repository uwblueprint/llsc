import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { DragIcon } from '@/components/ui';

interface CaregiverRankingFormProps {
  rankedPreferences: string[];
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onSubmit: () => void;
  itemScopes?: Array<'self' | 'loved_one'>;
  itemKinds?: Array<'quality' | 'treatment' | 'experience'>;
}

export function CaregiverRankingForm({
  rankedPreferences,
  onMoveItem,
  onSubmit,
  itemScopes,
  itemKinds,
}: CaregiverRankingFormProps) {
  const t = useTranslations('ranking');
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);

  const renderStatement = (index: number, label: string) => {
    const kind = itemKinds?.[index];
    const scope = itemScopes?.[index];
    const isLovedOneQuality = kind === 'quality' && scope === 'loved_one';
    const isLovedOneDynamic =
      (kind === 'treatment' || kind === 'experience') && scope === 'loved_one';
    const prefix = isLovedOneQuality
      ? t('preferVolunteerLovedOneSame')
      : isLovedOneDynamic
        ? t('preferVolunteerLovedOneHas')
        : t('preferVolunteerSame');
    return (
      <>
        {prefix}
        <Text as="span" fontWeight={700}>
          {label}
        </Text>
      </>
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onMoveItem(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <Box>
      <Heading
        as="h1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={600}
        color="brand.navy"
        fontSize={{ base: '24px', md: '28px' }}
        mb={8}
      >
        {t('volunteerMatchingPreferences')}
      </Heading>

      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg="gray.300" borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg="gray.300" borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg="brand.primary" borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color="brand.navy"
          fontSize={{ base: '18px', md: '20px' }}
          mb={3}
        >
          {t('rankingMatchPreferences')}
        </Heading>
        <Text
          color="brand.fieldText"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={2}
        >
          {t('informationUsedToMatch')}
        </Text>
        <Text
          color="brand.navy"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          fontWeight={600}
          mb={8}
        >
          {t('volunteerGuaranteed')}
        </Text>

        <VStack gap={5}>
          <Box w="full">
            <Text
              color="brand.fieldText"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="14px"
              mb={2}
            >
              {t('rankStatements')}
            </Text>
            <Text
              color="brand.fieldText"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="12px"
              mb={6}
            >
              {t('1MostAgreed5LeastAgreed')}
            </Text>

            <VStack gap={{ base: 6, md: 3 }} align="start">
              {rankedPreferences.map((statement, index) => {
                const isDragging = draggedIndex === index;
                const isDropTarget = dropTargetIndex === index;

                return (
                  <HStack
                    key={`ranking-item-${index}-${statement.slice(0, 20)}`}
                    w="full"
                    gap={4}
                    align="center"
                  >
                    <Text
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="16px"
                      fontWeight={600}
                      color="brand.navy"
                      minW="20px"
                    >
                      {index + 1}.
                    </Text>

                    <HStack
                      flex="1"
                      p={{ base: 5, md: 4 }}
                      bg={isDragging ? '#e5e7eb' : isDropTarget ? '#dbeafe' : '#f9fafb'}
                      border={`1px solid ${isDropTarget ? 'var(--chakra-colors-brand-primary)' : '#e5e7eb'}`}
                      borderRadius="6px"
                      cursor={isDragging ? 'grabbing' : 'grab'}
                      gap={3}
                      opacity={isDragging ? 0.5 : 1}
                      transition="all 0.2s ease"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      _hover={{
                        borderColor: 'brand.primary',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary-alpha)',
                        bg: isDragging ? '#e5e7eb' : '#f3f4f6',
                      }}
                    >
                      <Box
                        cursor={isDragging ? 'grabbing' : 'grab'}
                        p={{ base: 3, md: 1 }}
                        _hover={{ opacity: 0.7 }}
                      >
                        <DragIcon />
                      </Box>

                      <Text
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color="brand.navy"
                        flex="1"
                        userSelect="none"
                      >
                        {renderStatement(index, statement)}
                      </Text>
                    </HStack>
                  </HStack>
                );
              })}
            </VStack>
          </Box>
        </VStack>
      </Box>

      <Box w="full" display="flex" justifyContent={{ base: 'stretch', sm: 'flex-end' }}>
        <Button
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primaryEmphasis' }}
          _active={{ bg: 'brand.primaryEmphasis' }}
          onClick={onSubmit}
          w={{ base: 'full', sm: 'auto' }}
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          {t('submitPreferences')} →
        </Button>
      </Box>
    </Box>
  );
}
