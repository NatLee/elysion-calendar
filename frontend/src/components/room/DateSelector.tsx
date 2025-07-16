import React from 'react';
import { ClientCalendar } from '@/components/ClientCalendar';
import { DateSelectorProps } from '@/interface/DateSelectorProps';

export const DateSelector: React.FC<DateSelectorProps> = React.memo(({ selected, onSelect }) => {
  return (
    <ClientCalendar
      mode="single"
      selected={selected}
      onSelect={onSelect}
      className="rounded-md border shadow-sm"
    />
  );
});

DateSelector.displayName = 'DateSelector';