'use client';

import React from 'react';
import { addDays, startOfWeek, parseISO } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoomStatusView } from '@/components/room/RoomStatusView';
import { TimeGrid } from '@/components/room/TimeGrid';

import { WeeklyTimeGrid } from '@/components/room/WeeklyTimeGrid';
import { WeeklyControls } from '@/components/room/WeeklyControls';

import { LoadingState } from '@/components/room/LoadingState';
import { ErrorState } from '@/components/room/ErrorState';

import { useRoomData } from '@/hooks/useRoomData';
import { useWeeklyRoomData } from '@/hooks/useWeeklyRoomData';

export default function RoomsPage() {
  // Get today's date in YYYY-MM-DD format
  const initialDateStr = new Date().toISOString().split('T')[0];
  const initialDate = parseISO(initialDateStr);
  const initialStartDate = startOfWeek(initialDate, { weekStartsOn: 1 });
  
  const [date, setDate] = React.useState<Date>(initialDate);
  const [startDate, setStartDate] = React.useState<Date>(initialStartDate);
  
  // Update to the current date only on the client side
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
    // Update to current date after hydration is complete
    const currentDate = new Date();
    setDate(currentDate);
    setStartDate(startOfWeek(currentDate, { weekStartsOn: 1 }));
  }, []);

  const { roomData } = useRoomData(date);
  const { 
    weeklyData, 
    isLoading, 
    error: weeklyError, 
    refetch: refetchWeekly 
  } = useWeeklyRoomData(startDate);

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handlePreviousWeek = () => {
    setStartDate(addDays(startDate, -21));
  };

  const handleNextWeek = () => {
    setStartDate(addDays(startDate, 21));
  };

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
            onDateChange={handleDateChange}
            roomData={roomData}
          />
          {!isClient && (
            <div className="text-sm text-muted-foreground mt-2">
              正在載入當前日期資料...
            </div>
          )}
        </TabsContent>

        <TabsContent value="grid">
          <TimeGrid roomData={roomData} />
        </TabsContent>

        <TabsContent value="weekly">
          <WeeklyControls
            startDate={startDate}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            isLoading={isLoading}
          />
          
          {isLoading ? <LoadingState /> :
           weeklyError ? <ErrorState error={weeklyError} onRetry={refetchWeekly} /> :
           <WeeklyTimeGrid weeklyData={weeklyData} startDate={startDate} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}