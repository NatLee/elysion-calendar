import React, { useMemo, useCallback } from 'react';

import { format, addDays, parse } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { TimeSlot } from '@/components/room/TimeSlot';
import { Legend } from '@/components/room/Legend';

import { TIME_SLOTS } from '@/constants/TIME_SLOTS';

import { isBusinessHour } from '@/lib/room/isBusinessHour';
import { isTimeInBooking } from '@/lib/room/isTimeInBooking';

import type { WeeklyTimeGridProps } from '@/interface/WeeklyTimeGridProps';

export const WeeklyTimeGrid: React.FC<WeeklyTimeGridProps> = ({ weeklyData, startDate }) => {
  const rooms = useMemo(() => 
    weeklyData.values().next().value?.rooms || [],
    [weeklyData]
  );

  const getTimeSlotStatus = useCallback((date: string, time: string, room: Room, dayData?: RoomData) => {
    if (!isBusinessHour(time)) return "closed";

    const booking = dayData?.rooms
      .find(r => r.id === room.id)
      ?.bookings
      .find(b => isTimeInBooking(time, b));

    if (booking) {
      return {
        status: "booked",
        booking
      };
    }

    const currentDate = new Date();
    const slotDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    
    return slotDateTime < currentDate ? "past" : "available";
  }, []);

  return (
    <div className="overflow-auto">
      <div className="min-w-[1200px]">
        <div className="grid grid-cols-[120px_repeat(21,1fr)] sticky top-0 z-10">
          {/* Header */}
          <div className="bg-gray-100 p-2 border font-medium">時間</div>
          
          {Array.from({ length: 21 }).map((_, index) => {
            const date = addDays(startDate, index);
            return (
              <div
                key={index}
                className="bg-gray-100 p-2 border font-medium text-center"
              >
                <div>{format(date, 'MM/dd')}</div>
                <div className="text-sm text-gray-600">
                  {format(date, 'E', { locale: zhTW })}
                </div>
              </div>
            );
          })}

          {/* Time Grid */}
          {TIME_SLOTS.map((time) => (
            <React.Fragment key={time}>
              <div className="border p-2 sticky left-0 bg-white font-medium">
                {time}
              </div>
              {Array.from({ length: 21 }).map((_, dayIndex) => {
                const currentDate = format(addDays(startDate, dayIndex), 'yyyy-MM-dd');
                const dayData = weeklyData.get(currentDate);
                
                return (
                  <div key={`${currentDate}-${time}`} className="relative border min-h-[40px]">
                    <div className="grid grid-cols-1 h-full">
                      {rooms.map((room) => {
                        const status = getTimeSlotStatus(currentDate, time, room, dayData);
                        return (
                          <TimeSlot
                            key={`${room.id}-${time}`}
                            room={room}
                            time={time}
                            status={typeof status === 'object' ? status.status : status}
                            booking={typeof status === 'object' ? status.booking : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <Legend />
    </div>
  );
};