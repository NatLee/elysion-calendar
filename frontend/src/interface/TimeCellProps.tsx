import type { Booking } from '@/types/Booking';
import type { Room } from '@/types/Room';

export interface TimeCellProps {
  room: Room;
  time: string;
  booking?: Booking;
}