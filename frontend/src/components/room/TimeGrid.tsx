import React, { useMemo } from 'react';

import { TIME_SLOTS } from '@/constants/TIME_SLOTS';

import type { TimeGridProps } from '@/interface/TimeGridProps';
import type { Booking } from '@/types/Booking';

import { TimeCell } from '@/components/room/TimeCell';
import { RoomHeader } from '@/components/room/RoomHeader';

export const TimeGrid: React.FC<TimeGridProps> = ({ roomData }) => {
  const isTimeInBooking = (timeSlot: string, booking: Booking) => {
    const slotTime = new Date(`2000-01-01T${timeSlot}`);
    const startTime = new Date(`2000-01-01T${booking.start_time}`);
    const endTime = new Date(`2000-01-01T${booking.end_time}`);
    return slotTime >= startTime && slotTime < endTime;
  };

  // 使用 useMemo 來避免每次 render 都重新計算
  const rooms = useMemo(() => roomData?.rooms || [], [roomData]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border p-2 sticky left-0 bg-gray-50 z-10">時間</th>
            {rooms.map((room) => (
              <RoomHeader key={room.id} room={room} />
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((time) => (
            <tr key={time}>
              <td className="border p-2 sticky left-0 bg-white font-medium z-10">
                {time}
              </td>
              {rooms.map((room) => {
                const booking = room.bookings.find(b => isTimeInBooking(time, b));
                return (
                  <TimeCell
                    key={`${room.id}-${time}`}
                    room={room}
                    time={time}
                    booking={booking}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};