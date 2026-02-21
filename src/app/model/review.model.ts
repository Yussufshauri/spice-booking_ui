import { Tour } from "./tour.model";
import { User } from "./user.model";

export class Review {
  review_id!: number;
  rating!: number;
  comment!: string;
  reviewDate!: string;
  user!: User;
  tour!: Tour;
}