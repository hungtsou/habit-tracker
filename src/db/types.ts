export interface UserRow {
  id: string;
  email: string;
  password: string;
  created_at: Date;
}

export type PublicUser = Omit<UserRow, 'password'>;
