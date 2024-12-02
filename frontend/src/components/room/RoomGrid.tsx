import React from 'react';

import { RoomCard } from '@/components/room/RoomCard';

import { RoomGridProps } from '@/interface/RoomGridProps';

export const RoomGrid: React.FC<RoomGridProps> = React.memo(({ rooms }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
});

RoomGrid.displayName = 'RoomGrid';