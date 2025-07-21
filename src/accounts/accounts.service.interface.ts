import { Account } from './entities/account.entity';

export interface AccountsServiceItf {
  findAll(): Account[];
  findOne(param: GetAccountParam): Account;
  createAccount(param: CreateAccountParam): Account;
}

export type GetAccountParam = {
  userId: string;
};

export type CreateAccountParam = {
  accountName: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD';
};

export type PatchAccountParam = {
  userId: string;
  accountName: string;
  balance: number;
};

export type DeleteAccountParam = {
  userId: string;
};
