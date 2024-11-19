import React from 'react';

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

interface TimeGridProps {
  roomData: {
    rooms: Room[];
  } | null;
}

export const TimeGrid: React.FC<TimeGridProps> = ({ roomData }) => {
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border p-2 sticky left-0 bg-gray-50">時間</th>
            {roomData?.rooms.map((room) => (
              <th key={room.id} className="border p-2 min-w-[120px]">
                <div>{room.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time}>
              <td className="border p-2 sticky left-0 bg-white font-medium">
                {time}
              </td>
              {roomData?.rooms.map((room) => {
                const booking = room.bookings.find(b => isTimeInBooking(time, b));
                return (
                  <td 
                    key={`${room.id}-${time}`} 
                    className={`border p-2 ${
                      booking ? 'bg-blue-100' : ''
                    }`}
                  >
                    {booking?.customer || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
