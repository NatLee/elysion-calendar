import { Booking } from '@/types/Booking';

export const isTimeInBooking = (timeSlot: string, booking: Booking) => {
  const slotTime = new Date(`2000-01-01T${timeSlot}`);
  const startTime = new Date(`2000-01-01T${booking.start_time}`);
  const endTime = new Date(`2000-01-01T${booking.end_time}`);
  return slotTime >= startTime && slotTime < endTime;
};