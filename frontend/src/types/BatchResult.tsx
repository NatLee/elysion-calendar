
import { RoomData } from '@/types/RoomData';

export type BatchResult = 
| { date: string; data: RoomData; error?: never }
| { date: string; error: Error; data?: never };
