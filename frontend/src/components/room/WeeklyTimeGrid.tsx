import React from 'react';
import { format, subDays, isAfter, isBefore, parse } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { TIME_SLOTS } from '@/constants/TIME_SLOTS';
import { isBusinessHour } from '@/lib/room/isBusinessHour';
import { isTimeInBooking } from '@/lib/room/isTimeInBooking';
import type { Room, Booking } from '@/types/Room';
import type { RoomData } from '@/types/RoomData';

// 只保留 weeklyData, dates 兩個 props
interface WeeklyTimeGridProps {
  weeklyData: Map<string, RoomData>;
  dates: string[];
}

export const WeeklyTimeGrid: React.FC<WeeklyTimeGridProps> = ({ weeklyData, dates: displayDates }) => {
  // 收集所有房間 id 與名稱
  const allRooms: Room[] = React.useMemo(() => {
    const roomMap = new Map<number, Room>();
    for (const day of weeklyData.values()) {
      for (const room of day.rooms) {
        if (!roomMap.has(room.id)) {
          roomMap.set(room.id, { ...room });
        }
      }
    }
    return Array.from(roomMap.values());
  }, [weeklyData]);

  if (weeklyData.size === 0 || allRooms.length === 0) {
    return <div className="text-center text-gray-500 py-8">本週沒有資料</div>;
  }

  // 取得昨天的資料（用於跨天 booking）
  const yesterdayStr = displayDates.length > 0 ? format(subDays(new Date(displayDates[0]), 1), 'yyyy-MM-dd') : '';
  const yesterdayData = weeklyData.get(yesterdayStr);

  function isBookingCrossToDate(booking: Booking, bookingDate: string, targetDate: string, time: string) {
    if (bookingDate === targetDate) return false;
    const start = parse(`${bookingDate} ${booking.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(`${bookingDate} ${booking.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
    if (isAfter(start, end)) {
      const slotDateTime = parse(`${targetDate} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
      if (targetDate === format(subDays(end, 0), 'yyyy-MM-dd')) {
        const endTime = parse(`${targetDate} ${booking.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
        return isBefore(slotDateTime, endTime);
      }
    }
    return false;
  }

  return (
    <div className="flex flex-col gap-8">
      {displayDates.map((dateStr) => {
        const date = new Date(dateStr);
        const dayData = weeklyData.get(dateStr);
        return (
          <div key={dateStr}>
            <div className="font-bold text-lg mb-2 text-blue-700">
              {format(date, 'MM/dd (E)', { locale: zhTW })}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 sticky left-0 bg-gray-50 z-10">時間</th>
                    {allRooms.map(room => (
                      <th key={room.id} className="border p-2 text-center min-w-[120px]">
                        {room.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((time) => (
                    <tr key={time}>
                      <td className="border p-2 sticky left-0 bg-white font-medium z-10">{time}</td>
                      {allRooms.map(room => {
                        let cellClass = '';
                        let cellText = '';
                        if (!isBusinessHour(time)) {
                          cellClass = 'bg-gray-100 text-gray-500';
                          cellText = '非營業';
                        } else {
                          // 先找今天的 booking
                          const roomData = dayData?.rooms.find(r => r.id === room.id);
                          let booking = roomData?.bookings.find(b => isTimeInBooking(time, b));
                          // 如果今天沒 booking，檢查昨天有沒有跨天 booking
                          if (!booking && yesterdayData) {
                            const yRoom = yesterdayData.rooms.find(r => r.id === room.id);
                            if (yRoom) {
                              booking = yRoom.bookings.find(b => isBookingCrossToDate(b, yesterdayStr, dateStr, time));
                            }
                          }
                          const currentDate = new Date();
                          const slotDateTime = new Date(`${dateStr}T${time}`);
                          if (booking) {
                            cellClass = 'bg-red-100 text-red-700';
                            cellText = booking.customer;
                          } else if (slotDateTime < currentDate) {
                            cellClass = 'bg-gray-200 text-gray-400';
                            cellText = '已過期';
                          } else {
                            cellClass = 'bg-green-50 text-green-700';
                            cellText = '可預約';
                          }
                        }
                        return (
                          <td key={room.id + time} className={`border p-2 text-center align-middle ${cellClass}`}>
                            {cellText}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};