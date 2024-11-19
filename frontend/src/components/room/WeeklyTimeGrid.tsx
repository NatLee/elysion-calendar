import React from 'react';
import { format, addDays, parse } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface WeeklyTimeGridProps {
  weeklyData: Map<string, RoomData>;
  startDate: Date;
}

export const WeeklyTimeGrid: React.FC<WeeklyTimeGridProps> = ({ weeklyData, startDate }) => {
  // 生成時間格：9:00 到 24:00，每半小時一格
  const timeSlots = Array.from({ length: 30 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const isTimeInBooking = (timeSlot: string, booking: Booking) => {
    const slotTime = new Date(`2000-01-01T${timeSlot}`);
    const startTime = new Date(`2000-01-01T${booking.start_time}`);
    const endTime = new Date(`2000-01-01T${booking.end_time}`);
    return slotTime >= startTime && slotTime < endTime;
  };

  // 檢查時間段是否為營業時間
  const isBusinessHour = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 9 && hour < 24;
  };

  // 判斷時間段的狀態
  const getTimeSlotStatus = (date: string, time: string, room: Room, dayData?: RoomData) => {
    // 如果不是營業時間，返回 "closed"
    if (!isBusinessHour(time)) return "closed";

    // 檢查是否有預約
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

    // 檢查是否為可預約時段
    const currentDate = new Date();
    const slotDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    
    // 如果時間已過，則不可預約
    if (slotDateTime < currentDate) {
      return "past";
    }

    return "available";
  };

  // 獲取所有房間
  const rooms = weeklyData.values().next().value?.rooms || [];

  return (
    <div className="overflow-auto">
      <div className="min-w-[1200px]">
        <div className="grid grid-cols-[120px_repeat(21,1fr)] sticky top-0 z-10">
          {/* 時間列標題 */}
          <div className="bg-gray-100 p-2 border font-medium">時間</div>
          
          {/* 日期列標題 */}
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

          {/* 時間格 */}
          {timeSlots.map((time) => (
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
                        
                        if (typeof status === 'object' && status.status === 'booked') {
                          return (
                            <div
                              key={`${room.id}-${time}`}
                              className={cn(
                                "absolute inset-0 bg-blue-100 p-1 text-xs overflow-hidden",
                                "hover:z-10 hover:bg-blue-200 hover:min-h-[60px]"
                              )}
                              title={`${room.name}: ${status.booking.customer}\n${status.booking.start_time}-${status.booking.end_time}`}
                            >
                              <div className="font-medium">{room.name}</div>
                              <div className="truncate">{status.booking.customer}</div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${room.id}-${time}`}
                            className={cn(
                              "h-full w-full p-1 text-xs",
                              {
                                'bg-green-50 hover:bg-green-100 cursor-pointer': status === 'available',
                                'bg-gray-100': status === 'closed',
                                'bg-gray-200': status === 'past'
                              }
                            )}
                            title={`${room.name}: ${
                              status === 'available' ? '可預約' :
                              status === 'closed' ? '非營業時間' :
                              status === 'past' ? '已過期' : ''
                            }`}
                          >
                            {status === 'available' && (
                              <div className="font-medium text-green-600">
                                {room.name} 可預約
                              </div>
                            )}
                          </div>
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

      {/* 圖例說明 */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 mr-2"></div>
          <span>已預約</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-50 mr-2"></div>
          <span>可預約</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 mr-2"></div>
          <span>已過期</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 mr-2"></div>
          <span>非營業時間</span>
        </div>
      </div>
    </div>
  );
};
