import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';

import { RoomData } from '@/types/RoomData';

export const useWeeklyRoomData = (startDate: Date) => {
  const [weeklyData, setWeeklyData] = useState<Map<string, RoomData>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const batchFetchData = async (dates: string[]): Promise<Map<string, RoomData>> => {
    const batchSize = 7;
    const batches = [];
    
    for (let i = 0; i < dates.length; i += batchSize) {
      batches.push(dates.slice(i, i + batchSize));
    }
  
    const results = new Map<string, RoomData>();
  
    for (const batch of batches) {
      const batchPromises = batch.map(dateStr => 
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
  
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result) => {
        if ('data' in result && result.data) {
          results.set(result.date, result.data);
        }
      });
    }
  
    return results;
  };

  const fetchWeeklyData = async (startDate: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dates = Array.from({ length: 21 }).map((_, index) => {
        const currentDate = addDays(startDate, index);
        return format(currentDate, 'yyyy-MM-dd');
      });

      const results = await batchFetchData(dates);
      setWeeklyData(results);
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