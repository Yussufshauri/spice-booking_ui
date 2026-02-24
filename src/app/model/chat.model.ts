export interface ChatThread {
  thread_id: number;
  title: string;         // e.g. "Tourist: Ahmed"
  lastMessage?: string;
  updatedAt?: string;    // ISO string
}

export interface ChatMessage {
  message_id: number;
  thread_id: number;
  senderId: number;
  senderName?: string;
  text: string;
  createdAt: string;     // ISO string
}