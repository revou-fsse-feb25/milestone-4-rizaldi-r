import { User } from '@prisma/client';

export interface UserRepositoryItf {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User>;
  findByEmail(email: string): Promise<User>;
  update(id: number, userInput: updateParam): Promise<User>;
}

export interface updateParam {
  username?: string;
  email?: string;
  password?: string;
  firstName: string;
  lastName: string;
}
