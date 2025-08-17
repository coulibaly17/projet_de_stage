export interface UserInfo {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  discussionId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  isRead?: boolean;
  attachments?: MessageAttachment[];
  sender?: UserInfo;
}

export interface Discussion {
  id: string;
  title: string;
  courseId?: string;
  courseName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  tags: string[];
  isRead?: boolean;
  isPinned?: boolean;
  isGroup?: boolean;
  lastMessage?: Message;
  participants?: UserInfo[];
}

export interface PaginatedMessages {
  items: Message[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface MessageFormData {
  content: string;
  attachments?: File[];
}

export interface DiscussionFormData {
  title: string;
  participantIds: string[];
  initial_message: string;
  is_group: boolean;
}
