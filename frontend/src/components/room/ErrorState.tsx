import React from 'react';
import { ErrorStateProps } from '@/interface/ErrorStateProps';
  
export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="flex justify-center items-center min-h-[200px] text-red-500">
    <p>{error}</p>
    <button 
      onClick={onRetry}
      className="ml-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
    >
      重試
    </button>
  </div>
);
