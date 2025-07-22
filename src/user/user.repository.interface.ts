import { User } from '@prisma/client';

export interface UserRepositoryItf {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  // getFirst(param): User;
  // create(param: CreateParam): User;
}

// export type CreateParam = {
//   accountName: string;
//   accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD';
// };
