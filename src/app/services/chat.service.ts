import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../api/api.config';
import { ChatMessage, ChatThread } from '../model/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private chatApi = `${API.base}/chat`;

  constructor(private http: HttpClient) {}

  listThreads(): Observable<ChatThread[]> {
    return this.http.get<ChatThread[]>(`${this.chatApi}/threads`);
  }

  getMessages(threadId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.chatApi}/thread/${threadId}/messages`);
  }

  sendMessage(threadId: number, senderId: number, text: string): Observable<any> {
    return this.http.post(`${this.chatApi}/thread/${threadId}/send`, { senderId, text });
  }
}