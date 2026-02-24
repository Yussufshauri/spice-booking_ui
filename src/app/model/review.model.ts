import { User } from './user.model';
import { Tour } from './tour.model';

export interface Review {
  review_id: number;
  rating: number;
  comment: string;
  reviewDate: string; // or date string
  user: User;
  tour: Tour;
}