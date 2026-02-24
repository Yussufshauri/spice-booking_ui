import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../api/api.config';
import { Review } from '../model/review.model';

export type CreateReviewPayload = {
  userId: number;
  tourId: number;
  rating: number;
  comment: string;
};

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(API.review);
  }

  getReviewsByTour(tourId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${API.review}/tour/${tourId}`);
  }

  /**
   * ✅ Supports BOTH:
   * 1) createReview({ userId, tourId, rating, comment })
   * 2) createReview(userId, tourId, rating, comment)
   */
  createReview(payload: CreateReviewPayload): Observable<any>;
  createReview(userId: number, tourId: number, rating: number, comment: string): Observable<any>;
  createReview(
    a: number | CreateReviewPayload,
    b?: number,
    c?: number,
    d?: string
  ): Observable<any> {
    let userId: number;
    let tourId: number;
    let rating: number;
    let comment: string;

    if (typeof a === 'object') {
      userId = a.userId;
      tourId = a.tourId;
      rating = a.rating;
      comment = a.comment;
    } else {
      userId = a;
      tourId = b as number;
      rating = c as number;
      comment = d as string;
    }

    return this.http.post(`${API.review}/create`, null, {
      params: { userId, tourId, rating, comment },
    });
  }

  deleteReview(id: number) {
    return this.http.delete(`${API.review}/${id}`);
  }
}