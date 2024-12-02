import React from 'react';
import { Calendar } from '@/components/ui/calendar';

import { DateSelectorProps } from '@/interface/DateSelectorProps';

export const DateSelector: React.FC<DateSelectorProps> = React.memo(({ selected, onSelect }) => {
  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={onSelect}
      className="rounded-md border shadow-sm"
    />
  );
});

DateSelector.displayName = 'DateSelector';