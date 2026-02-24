export enum Role {
  Tourist = 'Tourist',
  Guide = 'Guide',
  Admin = 'Admin',
}

export interface User {
  user_id: number;
  name: string;
  username: string;
  email: string;
  role: Role;
}