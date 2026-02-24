import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../api/api.config';
import { User } from '../model/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(API.user);
  }

  register(payload: { name: string; username: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${API.user}/register`, payload);
  }

  registerGuide(payload: { name: string; username: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${API.user}/register-guide`, payload);
  }

  login(payload: { username: string; password: string }): Observable<User> {
    return this.http.post<User>(`${API.user}/login`, payload);
  }

  updateUser(user_id: number, payload: Partial<User> & { password?: string }): Observable<User> {
    return this.http.put<User>(`${API.user}/${user_id}`, payload);
  }

  deleteUser(user_id: number): Observable<any> {
    return this.http.delete(`${API.user}/${user_id}`);
  }
}