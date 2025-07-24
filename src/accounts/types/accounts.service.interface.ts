import { Account, AccountStatus, Currency, Transaction } from '@prisma/client';

export interface AccountServiceItf {
  findAll(): Promise<Account[]>;
  findAllByUserId(userId: number): Promise<Account[]>;
  findById(id: number): Promise<Account>;
  findAllWithTransactionsByUserId(
    userId: number,
  ): Promise<typeAccountWithTransaction[]>;
  findAccountWithTransactions(
    id: number,
  ): Promise<typeAccountWithTransaction | null>;
  create(userId: number, userInput: UserInputItf): Promise<Account>;
  updateBalance(accountId: number, newBalance: number): Promise<Account>;
  // updateStatus(accountId: number, status: typeStatus): Promise<Account>;
  delete(accountId: number): Promise<Account>;
}

export type typeAccountWithTransaction = Account & {
  from_transactions: Transaction[];
  to_transactions: Transaction[];
};

export interface UserInputItf {
  accountName: string;
  balance: number;
  currency: Currency;
  accountStatus?: AccountStatus;
}
