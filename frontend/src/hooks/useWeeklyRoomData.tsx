import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';

import { RoomData } from '@/types/RoomData';

export const useWeeklyRoomData = (startDate: Date) => {
  const [weeklyData, setWeeklyData] = useState<Map<string, RoomData>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);

  // 改為只查詢 7 天（單週）
  const fetchWeeklyData = async (startDate: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const dateArr = Array.from({ length: 7 }).map((_, index) => {
        const currentDate = addDays(startDate, index);
        return format(currentDate, 'yyyy-MM-dd');
      });
      setDates(dateArr);

      // 並行抓取所有日期資料
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
      setError('無法獲取週資料');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData(startDate);
  }, [startDate]);

  return { weeklyData, isLoading, error, refetch: () => fetchWeeklyData(startDate), dates };
};