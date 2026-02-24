import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../api/api.config';
import { Booking } from '../model/booking.model';
import { Status } from '../model/tour.model';

export type CreateBookingPayload = {
  userId: number;
  tourId: number;
  date: string;
};

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {}

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(API.booking);
  }

  // ✅ requires backend: GET /api/booking/user/{userId}
  getBookingsByUser(userId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API.booking}/user/${userId}`);
  }

  /**
   * ✅ Supports BOTH:
   * 1) createBooking({ userId, tourId, date })
   * 2) createBooking(userId, tourId, date)
   */
  createBooking(payload: CreateBookingPayload): Observable<any>;
  createBooking(userId: number, tourId: number, date: string): Observable<any>;
  createBooking(
    a: number | CreateBookingPayload,
    b?: number,
    c?: string
  ): Observable<any> {
    let userId: number;
    let tourId: number;
    let date: string;

    if (typeof a === 'object') {
      userId = a.userId;
      tourId = a.tourId;
      date = a.date;
    } else {
      userId = a;
      tourId = b as number;
      date = c as string;
    }

    return this.http.post(`${API.booking}/create`, null, {
      params: { userId, tourId, date },
    });
  }

  approveBooking(id: number) {
    return this.http.put(`${API.booking}/approve/${id}`, null);
  }

  rejectBooking(id: number) {
    return this.http.put(`${API.booking}/reject/${id}`, null);
  }

  /**
   * NOTE:
   * Endpoint hii haipo kwenye backend uliyonipa.
   * Ukiacha hapa bila backend endpoint, ukiitumia italeta 404.
   * Kama hutumii, unaweza kuifuta.
   */
  updateStatus(id: number, status: Status) {
    return this.http.put(`${API.booking}/${id}/status`, null, { params: { status } });
  }

  deleteBooking(id: number) {
    return this.http.delete(`${API.booking}/${id}`);
  }
}