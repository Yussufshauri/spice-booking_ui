import { Tour, Status } from './tour.model';
import { User } from './user.model';

export interface Booking {
  booking_id: number;
  user: User;
  tour: Tour;
  date: string;
  status: Status;
}

export { Status };
