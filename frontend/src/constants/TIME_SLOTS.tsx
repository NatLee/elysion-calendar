import { BUSINESS_HOURS } from '@/constants/BUSINESS_HOURS';

export const TIME_SLOTS = Array.from(
  { length: 30 },
  (_, i) => {
    const hour = Math.floor(i / 2) + BUSINESS_HOURS.START;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }
);