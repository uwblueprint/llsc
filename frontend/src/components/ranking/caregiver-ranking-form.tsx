import React from 'react';
import { Box, Heading, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { DragIcon } from '@/components/ui';
import { COLORS } from '@/constants/form';

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
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);

  const renderStatement = (index: number, label: string) => {
    const kind = itemKinds?.[index];
    const scope = itemScopes?.[index];
    const isLovedOneQuality = kind === 'quality' && scope === 'loved_one';
    const isLovedOneDynamic = (kind === 'treatment' || kind === 'experience') && scope === 'loved_one';
    const prefix = isLovedOneQuality
      ? 'I would prefer a volunteer whose loved one is '
      : isLovedOneDynamic
        ? 'I would prefer a volunteer whose loved one has '
        : 'I would prefer a volunteer with ';
    return (
      <>
        {prefix}
        <Text as="span" fontWeight={700}>{label}</Text>
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
        color={COLORS.veniceBlue}
        fontSize="28px"
        mb={8}
      >
        Volunteer Matching Preferences
      </Heading>

      <Box mb={10}>
        <HStack gap={3}>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.progressGray} borderRadius="full" />
          </Box>
          <Box flex="1">
            <Box h="3px" bg={COLORS.teal} borderRadius="full" />
          </Box>
        </HStack>
      </Box>

      <Box mb={10}>
        <Heading
          as="h2"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
          color={COLORS.veniceBlue}
          fontSize="20px"
          mb={3}
        >
          Ranking Match Preferences
        </Heading>
        <Text
          color={COLORS.fieldGray}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          mb={2}
        >
          This information will be used to match you with a suitable volunteer.
        </Text>
        <Text
          color={COLORS.veniceBlue}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15px"
          fontWeight={600}
          mb={8}
        >
          Note that your volunteer is guaranteed to speak your language and have the same
          availability.
        </Text>

        <VStack gap={5}>
          <Box w="full">
            <Text
              color={COLORS.fieldGray}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="14px"
              mb={2}
            >
              Rank the following statements in the order that you agree with them:
            </Text>
            <Text
              color={COLORS.fieldGray}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="12px"
              mb={6}
            >
              1 is most agreed, 5 is least agreed.
            </Text>

            <VStack gap={3} align="start">
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
                      color={COLORS.veniceBlue}
                      minW="20px"
                    >
                      {index + 1}.
                    </Text>

                    <HStack
                      flex="1"
                      p={4}
                      bg={isDragging ? '#e5e7eb' : isDropTarget ? '#dbeafe' : '#f9fafb'}
                      border={`1px solid ${isDropTarget ? COLORS.teal : '#e5e7eb'}`}
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
                        borderColor: COLORS.teal,
                        boxShadow: `0 0 0 1px ${COLORS.teal}20`,
                        bg: isDragging ? '#e5e7eb' : '#f3f4f6',
                      }}
                    >
                      <Box
                        cursor={isDragging ? 'grabbing' : 'grab'}
                        p={1}
                        _hover={{ opacity: 0.7 }}
                      >
                        <DragIcon />
                      </Box>

                      <Text
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="14px"
                        color={COLORS.veniceBlue}
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

      <Box w="full" display="flex" justifyContent="flex-end">
        <Button
          bg={COLORS.teal}
          color="white"
          _hover={{ bg: COLORS.teal }}
          _active={{ bg: COLORS.teal }}
          onClick={onSubmit}
          w="auto"
          h="40px"
          fontSize="14px"
          fontWeight={500}
          px={6}
        >
          Submit Preferences →
        </Button>
      </Box>
    </Box>
  );
}
