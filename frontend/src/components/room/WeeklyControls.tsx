import React from 'react';
import { format, addDays } from 'date-fns';

import { WeeklyControlsProps } from '@/interface/WeeklyControlsProps';

export const WeeklyControls: React.FC<WeeklyControlsProps> = ({
  startDate,
  onPreviousWeek,
  onNextWeek,
  isLoading,
}) => (
  <div className="mb-4 flex justify-between items-center">
    <button
      onClick={onPreviousWeek}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
      disabled={isLoading}
    >
      上一週
    </button>
    <span className="font-medium">
      {format(startDate, 'yyyy/MM/dd')} - {format(addDays(startDate, 6), 'yyyy/MM/dd')}
    </span>
    <button
      onClick={onNextWeek}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
      disabled={isLoading}
    >
      下一週
    </button>
  </div>
);