import { BUSINESS_HOURS } from '@/constants/BUSINESS_HOURS';
  
export const isBusinessHour = (time: string) => {
  const hour = parseInt(time.split(':')[0]);
  return hour >= BUSINESS_HOURS.START && hour < BUSINESS_HOURS.END;
};