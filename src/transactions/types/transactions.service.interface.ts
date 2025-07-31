import { Prisma, Transaction, TransactionType, User } from '@prisma/client';

export interface TransactionsServiceItf {
  create(createData: CreateParamItf): Promise<Transaction>;
  findAll(): Promise<Transaction[]>;
  findById(id: number): Promise<Transaction>;
  findAllByAccountId(accountId: number, user: User): Promise<Transaction[]>;
  findAllByUserId(userId: number): Promise<Transaction[]>;
}

export interface CreateParamItf {
  accountId: number;
  toAccountId?: number;
  amount: Prisma.Decimal;
  type: TransactionType;
  description?: string;
}
