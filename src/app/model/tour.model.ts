import { User } from './user.model';

export enum Status {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Canceled = 'Canceled',
  Approved = 'Approved',
}

export interface Tour {
  tour_id: number;
  title: string;
  description: string;
  price: number | string;
  location?: string;
  status: Status;
  date?: string;      // 'YYYY-MM-DD'
  imageUrl?: string;  // '/uploads/...'
  user?: User;        // wakati mwingine controller inaweza kuignore user - so optional
}