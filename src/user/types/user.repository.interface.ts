import { User, UserRole } from '@prisma/client';

export interface UserRepositoryItf {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  create(createData: createParam): Promise<User>;
  update(id: number, userInput: updateParam): Promise<User>;
}

export interface createParam {
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  userRole: UserRole;
}

export interface updateParam {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  lastLogin?: Date;
  refreshToken?: string;
}
