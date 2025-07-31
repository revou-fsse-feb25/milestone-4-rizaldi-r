import {
  Account,
  AccountStatus,
  Currency,
  Prisma,
  Transaction,
} from '@prisma/client';

export interface AccountServiceItf {
  findAll(): Promise<Account[]>;
  findAllByUserId(userId: number): Promise<Account[]>;
  findById(id: number): Promise<Account>;
  findAllWithTransactionsByUserId(
    userId: number,
  ): Promise<AccountWithTransactionType[]>;
  findAccountWithTransactions(
    id: number,
  ): Promise<AccountWithTransactionType | null>;
  create(userId: number, userInput: CreateParamItf): Promise<Account>;
  update(accountId: number, userInput: UpdateParamItf): Promise<Account>;
  updateBalance(
    accountId: number,
    newBalance: Prisma.Decimal,
  ): Promise<Account>;
  delete(accountId: number): Promise<Account>;
}

export type AccountWithTransactionType = Account & {
  from_transactions: Transaction[];
  to_transactions: Transaction[];
};

export interface UpdateParamItf {
  accountName?: string;
  accountStatus?: AccountStatus;
}

export interface CreateParamItf {
  accountName: string;
  currency: Currency;
  accountStatus?: AccountStatus;
}
