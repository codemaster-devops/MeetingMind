export interface ActionItem {
  owner: string;
  description: string;
  due_date: string | null;
}

export interface MeetingAnalysis {
  transcript: string;
  summary_points: string[];
  decisions: string[];
  action_items: ActionItem[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  PRICING = 'PRICING',
}

export interface ProcessingError {
  title: string;
  message: string;
}

export interface UserProfile {
  id: string;
  is_pro: boolean;
  stripe_customer_id?: string;
}

export interface UsageStats {
  used: number;
  limit: number;
  isPro: boolean;
}