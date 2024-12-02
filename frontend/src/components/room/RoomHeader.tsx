import React from 'react';

import { RoomHeaderProps } from '@/interface/RoomHeaderProps';

export const RoomHeader: React.FC<RoomHeaderProps> = React.memo(({ room }) => {
  return (
    <th className="border p-2 min-w-[120px]">
      <div className="font-medium">{room.name}</div>
    </th>
  );
});

RoomHeader.displayName = 'RoomHeader';