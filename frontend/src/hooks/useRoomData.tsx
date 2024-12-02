import { useState, useEffect } from 'react';
import { RoomData } from '@/types/RoomData';

export const useRoomData = (date: Date) => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomData = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/daily-schedule/${dateStr}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: RoomData = await response.json();
      setRoomData(data);
    } catch (error) {
      console.error('Failed to fetch room data:', error);
      setError('無法獲取單日資料');
    }
  };

  useEffect(() => {
    fetchRoomData(date);
  }, [date]);

  return { roomData, error, refetch: () => fetchRoomData(date) };
};