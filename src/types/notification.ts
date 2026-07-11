export interface NotificationData {
  type: string;
  title: string;
  description: string;
  ticket_report_id?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetNotificationsResponse {
  data: Notification[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}
