import { useState, useEffect } from 'react';
import { getUserById, createAvailability, deleteAvailability, TimeRange } from '@/APIClients/authAPIClient';
import { UserResponse } from '@/types/userTypes';
import { SaveMessage } from '@/types/userProfileTypes';

interface UseAvailabilityEditingProps {
  userId: string | string[] | undefined;
  user: UserResponse | null;
  setUser: (user: UserResponse) => void;
  setSaveMessage: (message: SaveMessage | null) => void;
}

export function useAvailabilityEditing({
  userId,
  user,
  setUser,
  setSaveMessage,
}: UseAvailabilityEditingProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ dayIndex: number; timeIndex: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ dayIndex: number; timeIndex: number } | null>(null);

  // Handle global mouse up for drag
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragStart && dragEnd) {
        const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
        const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
        const minTime = Math.min(dragStart.timeIndex, dragEnd.timeIndex);
        const maxTime = Math.max(dragStart.timeIndex, dragEnd.timeIndex);

        const newSlots = new Set(selectedTimeSlots);
        const slotsInRange: string[] = [];

        for (let day = minDay; day <= maxDay; day++) {
          for (let time = minTime; time <= maxTime; time++) {
            slotsInRange.push(`${day}-${time}`);
          }
        }

        const startKey = `${dragStart.dayIndex}-${dragStart.timeIndex}`;
        const isRemoving = selectedTimeSlots.has(startKey);

        slotsInRange.forEach(key => {
          if (isRemoving) {
            newSlots.delete(key);
          } else {
            newSlots.add(key);
          }
        });

        setSelectedTimeSlots(newSlots);
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragEnd, selectedTimeSlots]);

  const handleStartEditAvailability = () => {
    const slots = new Set<string>();
    if (user?.availability) {
      user.availability.forEach(block => {
        const date = new Date(block.startTime);
        const jsDay = date.getDay();
        const gridDay = jsDay === 0 ? 6 : jsDay - 1;
        
        const hour = date.getHours();
        const minute = date.getMinutes();
        const timeIndex = (hour - 8) * 2 + (minute === 30 ? 1 : 0);
        
        if (timeIndex >= 0 && timeIndex < 48) {
          slots.add(`${gridDay}-${timeIndex}`);
        }
      });
    }
    setSelectedTimeSlots(slots);
    setIsEditingAvailability(true);
  };

  const handleMouseDown = (dayIndex: number, timeIndex: number) => {
    if (!isEditingAvailability) return;
    setIsDragging(true);
    setDragStart({ dayIndex, timeIndex });
    setDragEnd({ dayIndex, timeIndex });
  };

  const handleMouseMove = (dayIndex: number, timeIndex: number) => {
    if (!isDragging || !isEditingAvailability) return;
    setDragEnd({ dayIndex, timeIndex });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minTime = Math.min(dragStart.timeIndex, dragEnd.timeIndex);
    const maxTime = Math.max(dragStart.timeIndex, dragEnd.timeIndex);

    const newSlots = new Set(selectedTimeSlots);
    const slotsInRange: string[] = [];

    for (let day = minDay; day <= maxDay; day++) {
      for (let time = minTime; time <= maxTime; time++) {
        slotsInRange.push(`${day}-${time}`);
      }
    }

    const startKey = `${dragStart.dayIndex}-${dragStart.timeIndex}`;
    const isRemoving = selectedTimeSlots.has(startKey);

    slotsInRange.forEach(key => {
      if (isRemoving) {
        newSlots.delete(key);
      } else {
        newSlots.add(key);
      }
    });

    setSelectedTimeSlots(newSlots);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const getDragRangeSlots = (): Set<string> => {
    if (!dragStart || !dragEnd) return new Set();
    
    const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minTime = Math.min(dragStart.timeIndex, dragEnd.timeIndex);
    const maxTime = Math.max(dragStart.timeIndex, dragEnd.timeIndex);

    const rangeSlots = new Set<string>();
    for (let day = minDay; day <= maxDay; day++) {
      for (let time = minTime; time <= maxTime; time++) {
        rangeSlots.add(`${day}-${time}`);
      }
    }
    return rangeSlots;
  };

  const convertSlotsToTimeRanges = (): TimeRange[] => {
    const referenceMonday = new Date('2000-01-03T00:00:00');
    const ranges: TimeRange[] = [];
    const slots = Array.from(selectedTimeSlots).map(key => {
      const [dayIndex, timeIndex] = key.split('-').map(Number);
      return { dayIndex, timeIndex };
    }).sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      return a.timeIndex - b.timeIndex;
    });

    interface TimeRangeSlot {
      dayIndex: number;
      startTimeIndex: number;
      endTimeIndex: number;
    }
    let currentRange: TimeRangeSlot | null = null;

    slots.forEach(({ dayIndex, timeIndex }) => {
      if (!currentRange || currentRange.dayIndex !== dayIndex || currentRange.endTimeIndex !== timeIndex - 1) {
        if (currentRange) {
          const startDate = new Date(referenceMonday);
          startDate.setDate(referenceMonday.getDate() + currentRange.dayIndex);
          startDate.setHours(8 + Math.floor(currentRange.startTimeIndex / 2), (currentRange.startTimeIndex % 2) * 30, 0, 0);
          
          const endDate = new Date(startDate);
          endDate.setMinutes(endDate.getMinutes() + 30 * (currentRange.endTimeIndex - currentRange.startTimeIndex + 1));
          
          ranges.push({
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          });
        }
        currentRange = { dayIndex, startTimeIndex: timeIndex, endTimeIndex: timeIndex };
      } else {
        if (currentRange) {
          currentRange.endTimeIndex = timeIndex;
        }
      }
    });

    if (currentRange !== null) {
      const range: TimeRangeSlot = currentRange;
      const startDate = new Date(referenceMonday);
      startDate.setDate(referenceMonday.getDate() + range.dayIndex);
      startDate.setHours(8 + Math.floor(range.startTimeIndex / 2), (range.startTimeIndex % 2) * 30, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30 * (range.endTimeIndex - range.startTimeIndex + 1));
      
      ranges.push({
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });
    }

    return ranges;
  };

  const handleSaveAvailability = async () => {
    if (!userId || !user) return;
    
    setIsSaving(true);
    try {
      const existingRanges: TimeRange[] = [];
      if (user.availability && user.availability.length > 0) {
        const sortedBlocks = [...user.availability].sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        
        let currentStart: Date | null = null;
        let currentEnd: Date | null = null;
        
        sortedBlocks.forEach(block => {
          const blockStart = new Date(block.startTime);
          const blockEnd = new Date(blockStart);
          blockEnd.setMinutes(blockEnd.getMinutes() + 30);
          
          if (!currentStart) {
            currentStart = blockStart;
            currentEnd = blockEnd;
          } else if (currentEnd && blockStart.getTime() === currentEnd.getTime()) {
            currentEnd = blockEnd;
          } else {
            if (currentStart && currentEnd) {
              existingRanges.push({
                startTime: currentStart.toISOString(),
                endTime: currentEnd.toISOString(),
              });
            }
            currentStart = blockStart;
            currentEnd = blockEnd;
          }
        });
        
        if (currentStart !== null && currentEnd !== null) {
          const start: Date = currentStart;
          const end: Date = currentEnd;
          existingRanges.push({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          });
        }
      }

      if (existingRanges.length > 0) {
        await deleteAvailability({
          userId: userId as string,
          delete: existingRanges,
        });
      }

      const newRanges = convertSlotsToTimeRanges();
      if (newRanges.length > 0) {
        await createAvailability({
          userId: userId as string,
          availableTimes: newRanges,
        });
      }

      const updatedUser = await getUserById(userId as string);
      setUser(updatedUser);
      setIsEditingAvailability(false);
      setSelectedTimeSlots(new Set());
      setSaveMessage({ type: 'success', text: 'Availability updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update availability:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update availability. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditAvailability = () => {
    setIsEditingAvailability(false);
    setSelectedTimeSlots(new Set());
  };

  return {
    isEditingAvailability,
    selectedTimeSlots,
    isDragging,
    dragStart,
    isSaving,
    getDragRangeSlots,
    handleStartEditAvailability,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSaveAvailability,
    handleCancelEditAvailability,
  };
}

