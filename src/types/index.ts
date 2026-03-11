export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  statusCode: number;
}

// Attached to req.user by the auth middleware after JWT verification.
export interface AuthPayload {
  userId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
