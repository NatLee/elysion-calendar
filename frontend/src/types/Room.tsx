
import { Booking } from '@/types/Booking';

export interface Room {
  id: number;
  name: string;
  bookings: Booking[];
}
  