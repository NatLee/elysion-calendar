import React from 'react';

export const Legend: React.FC = () => (
  <div className="mt-4 flex gap-4 text-sm">
    <div className="flex items-center">
      <div className="w-4 h-4 bg-blue-100 mr-2"></div>
      <span>已預約</span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 bg-green-50 mr-2"></div>
      <span>可預約</span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 bg-gray-200 mr-2"></div>
      <span>已過期</span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 bg-gray-100 mr-2"></div>
      <span>非營業時間</span>
    </div>
  </div>
);