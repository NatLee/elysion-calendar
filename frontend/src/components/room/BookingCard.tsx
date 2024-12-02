import React from 'react';

import { BookingCardProps } from '@/interface/BookingCardProps';

export const BookingCard: React.FC<BookingCardProps> = React.memo(({ booking }) => {
  return (
    <div className="text-sm p-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
      <div className="font-medium">{booking.customer}</div>
      <div className="text-gray-600">
        {booking.start_time} - {booking.end_time}
      </div>
      <div className="text-gray-500 text-xs">
        {booking.duration}
      </div>
    </div>
  );
});

BookingCard.displayName = 'BookingCard';