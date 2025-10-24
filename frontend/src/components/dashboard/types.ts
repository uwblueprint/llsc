export interface TimeSlot {
  day: string;
  time: string;
  selected: boolean;
}

export interface TimeSchedulerProps {
  showAvailability?: boolean;
  onTimeSlotsChange?: (timeSlots: TimeSlot[]) => void;
  prepopulateFromAPI?: boolean;
}

export interface AvailabilitySidebarProps {
  selectedTimeSlots: TimeSlot[];
}

export interface TimeSlotProps {
  day: string;
  hour: number;
  isSelected: boolean;
  onClick: () => void;
  isLastColumn?: boolean;
} 