import { Room } from "@/types/Room";

export interface RoomStatusViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  roomData: {
    rooms: Room[];
    url: string;
  } | null;
}