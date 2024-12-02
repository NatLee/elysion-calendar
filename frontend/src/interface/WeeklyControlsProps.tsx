export interface WeeklyControlsProps {
  startDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  isLoading: boolean;
}