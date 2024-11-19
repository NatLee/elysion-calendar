'use client';

import React from 'react';
import { RoomStatusView } from '@/components/room/RoomStatusView';
import { TimeGrid } from '@/components/room/TimeGrid';
import { WeeklyTimeGrid } from '@/components/room/WeeklyTimeGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfWeek, addDays, format } from 'date-fns';
import { Loader2 } from "lucide-react";

interface Booking {
  customer: string;
  start_time: string;
  end_time: string;
  duration: string;
}

interface Room {
  id: number;
  name: string;
  bookings: Booking[];
}

interface RoomData {
  date: string;
  rooms: Room[];
  url: string;
}

type BatchResult = 
  | { date: string; data: RoomData; error?: never }
  | { date: string; error: Error; data?: never };

export default function RoomsPage() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [roomData, setRoomData] = React.useState<RoomData | null>(null);
  const [weeklyData, setWeeklyData] = React.useState<Map<string, RoomData>>(new Map());
  const [startDate, setStartDate] = React.useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // 批量獲取資料的函數
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
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data: RoomData) => ({ 
            date: dateStr, 
            data 
          } as BatchResult))
          .catch(error => ({ 
            date: dateStr, 
            error: error instanceof Error ? error : new Error(String(error))
          } as BatchResult))
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

  // 獲取單日資料
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

  // 獲取三週資料
  const fetchWeeklyData = async (startDate: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 準備21天的日期字串
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

  React.useEffect(() => {
    fetchRoomData(date);
  }, [date]);

  React.useEffect(() => {
    fetchWeeklyData(startDate);
  }, [startDate]);

  const handlePreviousWeek = () => {
    const newStartDate = addDays(startDate, -21);
    setStartDate(newStartDate);
  };

  const handleNextWeek = () => {
    const newStartDate = addDays(startDate, 21);
    setStartDate(newStartDate);
  };

  // 渲染載入中狀態
  const renderLoading = () => (
    <div className="flex justify-center items-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <span className="ml-2 text-gray-500">載入中...</span>
    </div>
  );

  // 渲染錯誤狀態
  const renderError = () => (
    <div className="flex justify-center items-center min-h-[200px] text-red-500">
      <p>{error}</p>
      <button 
        onClick={() => fetchWeeklyData(startDate)}
        className="ml-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
      >
        重試
      </button>
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">包廂預約狀態</h1>
      
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="cards">包廂卡片</TabsTrigger>
          <TabsTrigger value="grid">時間表格</TabsTrigger>
          <TabsTrigger value="weekly">三週檢視</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <RoomStatusView
            date={date}
            onDateChange={(newDate) => {
              setDate(newDate);
              fetchRoomData(newDate);
            }}
            roomData={roomData}
          />
        </TabsContent>

        <TabsContent value="grid">
          <TimeGrid roomData={roomData} />
        </TabsContent>

        <TabsContent value="weekly">
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={handlePreviousWeek}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              disabled={isLoading}
            >
              上三週
            </button>
            <span className="font-medium">
              {format(startDate, 'yyyy/MM/dd')} - {format(addDays(startDate, 20), 'yyyy/MM/dd')}
            </span>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              disabled={isLoading}
            >
              下三週
            </button>
          </div>
          
          {isLoading ? renderLoading() :
           error ? renderError() :
           <WeeklyTimeGrid weeklyData={weeklyData} startDate={startDate} />}
        </TabsContent>
      </Tabs>

      {roomData?.url && (
        <div className="mt-4 text-sm text-gray-500">
          <a href={roomData.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            查看原始資料
          </a>
        </div>
      )}
    </div>
  );
}