import React from 'react';
import { cn } from '@/lib/utils';

import { TimeSlotProps } from '@/interface/TimeSlotProps';

export const TimeSlot: React.FC<TimeSlotProps> = React.memo(({ room, time, status, booking }) => {
  if (status === 'booked' && booking) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-blue-100 p-1 text-xs overflow-hidden",
          "hover:z-10 hover:bg-blue-200 hover:min-h-[60px]"
        )}
        title={`${room.name}: ${booking.customer}\n${booking.start_time}-${booking.end_time}`}
      >
        <div className="font-medium">{room.name}</div>
        <div className="truncate">{booking.customer}</div>
      </div>
    );
  }

  return (
    <div
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
});

