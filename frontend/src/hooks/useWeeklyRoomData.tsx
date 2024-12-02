import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';

import { RoomData } from '@/types/RoomData';

export const useWeeklyRoomData = (startDate: Date) => {
  const [weeklyData, setWeeklyData] = useState<Map<string, RoomData>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyData = async (startDate: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dates = Array.from({ length: 21 }).map((_, index) => {
        const currentDate = addDays(startDate, index);
        return format(currentDate, 'yyyy-MM-dd');
      });

      const promises = dates.map(dateStr => 
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
      setError('無法獲取週資料');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData(startDate);
  }, [startDate]);

  return { weeklyData, isLoading, error, refetch: () => fetchWeeklyData(startDate) };
};