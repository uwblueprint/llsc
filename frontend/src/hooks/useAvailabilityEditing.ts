import { useState, useEffect } from 'react';
import {
  getUserById,
  createAvailability,
  deleteAvailability,
  AvailabilityTemplate,
} from '@/APIClients/authAPIClient';
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

        slotsInRange.forEach((key) => {
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
      // Convert availability templates to grid slots
      user.availability.forEach((template) => {
        const dayOfWeek = template.dayOfWeek; // Already 0=Mon, 6=Sun

        // Parse start and end times (format: "HH:MM:SS" or "HH:MM")
        const parseTime = (timeStr: string): { hour: number; minute: number } => {
          const parts = timeStr.split(':');
          return {
            hour: parseInt(parts[0], 10),
            minute: parseInt(parts[1], 10),
          };
        };

        const startTime = parseTime(template.startTime);
        const endTime = parseTime(template.endTime);

        // Calculate time indices
        const startTimeIndex = (startTime.hour - 8) * 2 + (startTime.minute === 30 ? 1 : 0);
        const endTimeIndex = (endTime.hour - 8) * 2 + (endTime.minute === 30 ? 1 : 0);

        // Add all slots in the range
        for (let timeIndex = startTimeIndex; timeIndex < endTimeIndex; timeIndex++) {
          if (timeIndex >= 0 && timeIndex < 48) {
            slots.add(`${dayOfWeek}-${timeIndex}`);
          }
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

    slotsInRange.forEach((key) => {
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

  /**
   * Convert selected grid slots to availability templates (day_of_week + time ranges)
   */
  const convertSlotsToTemplates = (): AvailabilityTemplate[] => {
    const templates: AvailabilityTemplate[] = [];
    const slots = Array.from(selectedTimeSlots)
      .map((key) => {
        const [dayIndex, timeIndex] = key.split('-').map(Number);
        return { dayIndex, timeIndex };
      })
      .sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.timeIndex - b.timeIndex;
      });

    interface TemplateSlot {
      dayIndex: number;
      startTimeIndex: number;
      endTimeIndex: number;
    }
    let currentRange: TemplateSlot | null = null;

    slots.forEach(({ dayIndex, timeIndex }) => {
      if (
        !currentRange ||
        currentRange.dayIndex !== dayIndex ||
        currentRange.endTimeIndex !== timeIndex - 1
      ) {
        if (currentRange) {
          // Convert timeIndex to hours and minutes
          const startHour = 8 + Math.floor(currentRange.startTimeIndex / 2);
          const startMinute = (currentRange.startTimeIndex % 2) * 30;
          const endHour = 8 + Math.floor((currentRange.endTimeIndex + 1) / 2);
          const endMinute = ((currentRange.endTimeIndex + 1) % 2) * 30;

          templates.push({
            dayOfWeek: currentRange.dayIndex,
            startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`,
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
      const range: TemplateSlot = currentRange;
      const startHour = 8 + Math.floor(range.startTimeIndex / 2);
      const startMinute = (range.startTimeIndex % 2) * 30;
      const endHour = 8 + Math.floor((range.endTimeIndex + 1) / 2);
      const endMinute = ((range.endTimeIndex + 1) % 2) * 30;

      templates.push({
        dayOfWeek: range.dayIndex,
        startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`,
      });
    }

    return templates;
  };

  const handleSaveAvailability = async () => {
    if (!userId || !user) return;

    setIsSaving(true);
    try {
      // Convert selected slots to templates and create them
      // Backend create_availability replaces all existing templates, so we don't need to delete separately
      const newTemplates = convertSlotsToTemplates();
      await createAvailability({
        userId: userId as string,
        templates: newTemplates,
      });

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
