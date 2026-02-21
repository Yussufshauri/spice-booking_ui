import { Booking } from "./booking.model";
import { Review } from "./review.model";
import { Tour } from "./tour.model";

export class User {
  id!: number;
  name!: string;
  username!: string;
  email!: string;
  password!: string;
  role!: Role;
  tours?: Tour[];      
  reviews?: Review[];  
  bookings?: Booking[];
}
export enum Role {
  Tourist = 'Tourist',
  Guide = 'Guide',
  Admin = 'Admin'
}