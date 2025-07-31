import { User, UserRole } from '@prisma/client';

export interface UserRepositoryItf {
  findAll(): Promise<User[] | null>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(createData: createParam): Promise<User>;
  update(id: number, userInput: updateParam): Promise<User | null>;
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
  hashedPassword?: string;
  firstName?: string;
  lastName?: string;
  lastLogin?: Date;
  refreshToken?: string;
}
