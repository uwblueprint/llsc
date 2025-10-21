export interface TimeSlot {
  day: string;
  time: string;
  selected: boolean;
}

export interface TimeSchedulerProps {
  selectedTimeSlots: TimeSlot[];
  onTimeSlotToggle: (day: string, hour: number) => void;
  onConfirm?: () => void;
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