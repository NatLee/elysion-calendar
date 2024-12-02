import React from 'react';
import { cn } from '@/lib/utils';

import { TimeCellProps } from '@/interface/TimeCellProps';

export const TimeCell: React.FC<TimeCellProps> = React.memo(({ booking }) => {
  return (
    <td 
      className={cn(
        "border p-2",
        booking ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-50",
      )}
      title={booking ? `${booking.customer} (${booking.start_time}-${booking.end_time})` : undefined}
    >
      <div className="truncate">
        {booking?.customer || ''}
      </div>
    </td>
  );
});

TimeCell.displayName = 'TimeCell';