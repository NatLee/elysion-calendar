'use client';

import { useState, useEffect, Suspense } from 'react';
import { Calendar as UICalendar, CalendarProps } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Calendar skeleton component that mimics the calendar layout
 */
function CalendarSkeleton() {
  return (
    <div className="p-3 border rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-7 w-7" />
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={`weekday-${i}`} className="h-5 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[...Array(42)].map((_, i) => (
          <Skeleton key={`day-${i}`} className="h-9 w-9 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/**
 * Client-only calendar component with optimized loading experience
 */
export function ClientCalendar(props: CalendarProps) {
  // Track if we're in the client and if component is ready
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Mark component as client-side on mount
  useEffect(() => {
    setIsClient(true);
    
    // Add a small timeout to ensure smooth transition
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // Preload the calendar as soon as possible
  useEffect(() => {
    // Preload calendar styles
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = '/calendar-styles.css'; // Adjust path if needed
    document.head.appendChild(link);
  }, []);

  if (!isClient) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="relative">
      {!isReady && <div className="absolute inset-0 z-10"><CalendarSkeleton /></div>}
      <div className={isReady ? 'opacity-100' : 'opacity-0'}>
        <UICalendar {...props} />
      </div>
    </div>
  );
}