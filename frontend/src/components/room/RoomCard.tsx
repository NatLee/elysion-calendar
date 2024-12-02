import React from 'react';

import { Card } from '@/components/ui/card';
import { BookingCard } from '@/components/room/BookingCard';

import { RoomCardProps } from '@/interface/RoomCardProps';

export const RoomCard: React.FC<RoomCardProps> = React.memo(({ room }) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="font-bold">{room.name}</div>
      <div className="mt-2 space-y-2">
        {room.bookings.length > 0 ? (
          room.bookings.map((booking, index) => (
            <BookingCard key={index} booking={booking} />
          ))
        ) : (
          <div className="text-sm text-gray-500">無預約</div>
        )}
      </div>
    </Card>
  );
});

RoomCard.displayName = 'RoomCard';