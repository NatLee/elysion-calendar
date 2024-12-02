
import { RoomData } from '@/types/RoomData';

export interface WeeklyTimeGridProps {
  weeklyData: Map<string, RoomData>;
  startDate: Date;
}