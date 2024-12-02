import { Room } from '@/types/Room';
import { Booking } from '@/types/Booking';

export interface TimeSlotProps {
  room: Room;
  time: string;
  status: 'available' | 'booked' | 'closed' | 'past';
  booking?: Booking;
}