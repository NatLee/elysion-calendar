import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';

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

interface RoomStatusViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  roomData: {
    rooms: Room[];
  } | null;
}

export const RoomStatusView: React.FC<RoomStatusViewProps> = ({
  date,
  onDateChange,
  roomData,
}) => {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && onDateChange(date)}
            className="rounded-md border"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roomData?.rooms.map((room) => (
            <Card key={room.id} className="p-4">
              <div className="font-bold">{room.name}</div>
              <div className="mt-2 space-y-2">
                {room.bookings.map((booking, index) => (
                  <div key={index} className="text-sm p-2 bg-blue-50 rounded">
                    <div className="font-medium">{booking.customer}</div>
                    <div className="text-gray-600">
                      {booking.start_time} - {booking.end_time}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {booking.duration}
                    </div>
                  </div>
                ))}
                {room.bookings.length === 0 && (
                  <div className="text-sm text-gray-500">無預約</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
