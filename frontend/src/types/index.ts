export type UserRole = "admin" | "delegate" | "producer" | "buyer";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  organization_id: number | null;
  cooperative_id: number | null;
  member_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  created_at: string;
}

export interface Cooperative {
  id: number;
  name: string;
  organization_id: number;
  description: string | null;
  created_at: string;
}

export type AnnouncementStatus = "pending" | "approved" | "rejected" | "sold";

export interface Announcement {
  id: number;
  producer_id: number;
  variety: string;
  quantity: number;
  price: number;
  maturity: string;
  photo_url: string | null;
  harvest_date: string | null;
  status: AnnouncementStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedAnnouncements {
  items: Announcement[];
  total: number;
  page: number;
  pages: number;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface MembershipRequest {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  organization_id: number;
  cooperative_id: number;
  status: RequestStatus;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type NotificationType =
  | "announcement_approved"
  | "announcement_rejected"
  | "new_announcement_pending"
  | "new_membership_request"
  | "membership_approved"
  | "membership_rejected"
  | "new_message";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  reference_id: number | null;
  reference_type: string | null;
  created_at: string;
}

export interface UserBrief {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Conversation {
  id: number;
  participant_1_id: number;
  participant_2_id: number;
  announcement_id: number | null;
  last_message_at: string | null;
  created_at: string;
  other_participant: UserBrief;
  last_message_preview: string | null;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}
