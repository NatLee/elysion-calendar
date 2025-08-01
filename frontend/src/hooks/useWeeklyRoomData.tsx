import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';

import { RoomData } from '@/types/RoomData';

export const useWeeklyRoomData = (startDate: Date) => {
  const [weeklyData, setWeeklyData] = useState<Map<string, RoomData>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);

  // Change to querying only 7 days (a single week)
  const fetchWeeklyData = async (startDate: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const dateArr = Array.from({ length: 7 }).map((_, index) => {
        const currentDate = addDays(startDate, index);
        return format(currentDate, 'yyyy-MM-dd');
      });
      setDates(dateArr);

      // Fetch data for all dates in parallel
      const promises = dateArr.map(dateStr => 
        fetch(`/api/daily-schedule/${dateStr}`)
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
          })
          .then((data: RoomData) => ({ date: dateStr, data }))
          .catch(error => ({ 
            date: dateStr, 
            error: error instanceof Error ? error : new Error(String(error))
          }))
      );
      const results = await Promise.all(promises);
      const newData = new Map<string, RoomData>();
      results.forEach((result) => {
        if ('data' in result && result.data) {
          newData.set(result.date, result.data);
        }
      });
      setWeeklyData(newData);
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
      setError('Failed to fetch weekly data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData(startDate);
  }, [startDate]);

  return { weeklyData, isLoading, error, refetch: () => fetchWeeklyData(startDate), dates };
};