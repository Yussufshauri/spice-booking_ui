import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../api/api.config';
import { Status, Tour } from '../model/tour.model';

@Injectable({ providedIn: 'root' })
export class TourService {
  constructor(private http: HttpClient) {}

  getAllTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(API.tour);
  }

  getTourById(id: number): Observable<Tour> {
    return this.http.get<Tour>(`${API.tour}/${id}`);
  }

  createTour(payload: {
    title: string;
    description: string;
    price: number;
    date: string;
    userId: number;
    image: File;
  }): Observable<Tour> {
    const fd = new FormData();
    fd.append('title', payload.title);
    fd.append('description', payload.description);
    fd.append('price', String(payload.price));
    fd.append('date', payload.date);
    fd.append('userId', String(payload.userId));
    fd.append('image', payload.image);

    return this.http.post<Tour>(`${API.tour}/create`, fd);
  }

  updateTour(id: number, tour: Partial<Tour>): Observable<Tour> {
    return this.http.put<Tour>(`${API.tour}/${id}`, tour);
  }

  updateTourStatus(id: number, status: Status) {
    return this.http.put(`${API.tour}/${id}/status`, null, { params: { status } });
  }

  deleteTour(id: number) {
    return this.http.delete(`${API.tour}/${id}`);
  }
}