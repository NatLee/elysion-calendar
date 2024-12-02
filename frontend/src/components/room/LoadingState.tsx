import { Loader2 } from "lucide-react";

export const LoadingState = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    <span className="ml-2 text-gray-500">載入中...</span>
  </div>
);