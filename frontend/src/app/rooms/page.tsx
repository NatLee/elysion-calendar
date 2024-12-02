'use client';

import React from 'react';
import { addDays, startOfWeek } from 'date-fns';

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
  const [date, setDate] = React.useState<Date>(new Date());
  const [startDate, setStartDate] = React.useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const { roomData, error: roomError } = useRoomData(date);
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