import { Review } from './review.model';
import { User } from './user.model';

export class Tour {
  tour_id!: number;
  name!: string;
  description!: string;
  price!: string;
  location!: string;
  status: Status = Status.Pending;
  user!: User;
  reviews!: Review[];
}

export enum Status {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}
