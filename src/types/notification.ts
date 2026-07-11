export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string; // The ID of the related entity (e.g., ticket_report_id)
  is_read: boolean;
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
