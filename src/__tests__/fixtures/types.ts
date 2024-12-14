export enum UserType {
  Admin = 'admin',
  User = 'user',
  Trial = 'trial',
  Guest = 'guest'
}

export type User = {
  id: number;
  name: string;
  email: string;
  type: UserType;
};

export type UserList = User[];

export type UserQuery = {
  name?: string;
  email?: string;
};

export type CreateUserRequest = {
  name: string;
  email: string;
};

export type DeleteUserRequest = {
  userId: number;
};

export type Post = {
  id: number;
  userId: number;
  title: string;
  content: string;
};

export type ErrorResponse = {
  code: number;
  message: string;
};