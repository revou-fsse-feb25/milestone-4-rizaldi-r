import {
  Account,
  AccountStatus,
  Currency,
  Prisma,
  Transaction,
} from '@prisma/client';

export interface ItfAccountsRepository {
  findAll(): Promise<Account[]>;
  // findAllByUserId(
  //   userId: number,
  //   selectedField?: Partial<Record<keyof Account, boolean>>,
  // ): Promise<Account[]>;
  findById(id: number): Promise<Account>;
  findAllWithTransactionsByUserId(
    userId: number,
  ): Promise<typeAccountWithTransaction[]>;
  findAccountWithTransactions(
    id: number,
  ): Promise<typeAccountWithTransaction | null>;
  create(userId: number, userInput: UserInputItf): Promise<Account>;
  updateBalance(id: number, newBalance: Prisma.Decimal): Promise<Account>;
  updateStatus(id: number, status: AccountStatus): Promise<Account>;
  delete(id: number): Promise<Account>;
}

export type typeAccountWithTransaction = Account & {
  from_transactions: Transaction[];
  to_transactions: Transaction[];
};

export interface UserInputItf {
  accountName: string;
  accountNumber: string;
  balance: number;
  currency: Currency;
  accountStatus: AccountStatus;
}
