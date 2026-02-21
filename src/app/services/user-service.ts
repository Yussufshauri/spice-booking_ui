import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../model/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userApi = 'http://localhost:8080/api/user';

  constructor(private http: HttpClient) {}

  // =========================
  // GET ALL USERS
  // =========================
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userApi);
  }

  // =========================
  // REGISTER
  // =========================
  register(user: Partial<User>) {
    return this.http.post<User>(`${this.userApi}/register`, user);
  }
  
  // REGISTER GUIDE (ADMIN ONLY)
  registerGuide(user: Partial<User>) {
    return this.http.post<User>(`${this.userApi}/register-guide`, user);
  }

  // =========================
  // LOGIN
  // =========================
  login(credentials: { username: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.userApi}/login`, credentials);
  }

  // =========================
  // UPDATE USER
  // =========================
  updateUser(user_id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.userApi}/${user_id}`, user);
  }

  // =========================
  // DELETE USER
  // =========================
  deleteUser(user_id: number): Observable<any> {
    return this.http.delete(`${this.userApi}/${user_id}`);
  }
}
