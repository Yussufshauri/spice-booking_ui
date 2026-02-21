import { User } from "./user.model";

export class Booking {
  booking_id!: number;
  user!: User;
  date!: string;
  status!: Status;
}
export enum Status {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}