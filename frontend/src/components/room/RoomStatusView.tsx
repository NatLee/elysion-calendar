import React from 'react';

import type { RoomStatusViewProps } from '@/interface/RoomStatusViewProps';

import { DateSelector } from '@/components/room/DateSelector';
import { RoomGrid } from '@/components/room/RoomGrid';

export const RoomStatusView: React.FC<RoomStatusViewProps> = ({
  date,
  onDateChange,
  roomData,
}) => {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <DateSelector
            selected={date}
            onSelect={(date) => date && onDateChange(date)}
          />
        </div>
        {roomData?.rooms && <RoomGrid rooms={roomData.rooms} />}
      </div>
    </div>
  );
};