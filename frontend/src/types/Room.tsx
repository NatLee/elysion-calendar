
import { Booking } from './Booking';

export interface Room {
  id: number;
  name: string;
  bookings: Booking[];
}
