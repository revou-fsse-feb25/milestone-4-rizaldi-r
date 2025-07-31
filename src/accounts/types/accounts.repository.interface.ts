import {
  Account,
  AccountStatus,
  Currency,
  Prisma,
  Transaction,
} from '@prisma/client';

export interface ItfAccountsRepository {
  findAll(): Promise<Account[]>;
  findAllWithTransactionsByUserId(
    userId: number,
  ): Promise<AccountWithTransactionType[]>;
  findAccountWithTransactions(
    id: number,
  ): Promise<AccountWithTransactionType | null>;
  create(userId: number, userInput: CreateParamItf): Promise<Account>;
  update(
    id: number,
    updateData: UpdateParamItf,
    prismaTransaction?: Prisma.TransactionClient,
  ): Promise<Account>;
  updateBalance(
    id: number,
    newBalance: Prisma.Decimal,
    prismaTransaction?: Prisma.TransactionClient,
  ): Promise<Account>;
  updateStatus(id: number, status: AccountStatus): Promise<Account>;
  delete(id: number): Promise<Account>;
}

export type AccountWithTransactionType = Account & {
  from_transactions: Transaction[];
  to_transactions: Transaction[];
};

export interface CreateParamItf {
  accountName: string;
  accountNumber: string;
  balance: Prisma.Decimal;
  currency: Currency;
  accountStatus: AccountStatus;
}

export interface UpdateParamItf {
  accountName?: string;
  balance?: Prisma.Decimal;
  accountStatus?: AccountStatus;
}
