import { Injectable } from '@nestjs/common';
import {
  AccountRepositoryItf,
  CreateAccountParam,
  DeleteAccountParam,
  GetAccountParam,
  PatchAccountParam,
} from './account.repository.interface';
import { Account } from './entities/account.entity';
import { AccountNotFoundRepositoryException } from './exceptions/account-not-found.exception.repository';

@Injectable()
export class AccountRepository implements AccountRepositoryItf {
  private readonly accounts: Account[] = [
    {
      userId: 'user123',
      accountName: 'Primary Savings',
      balance: 1000000,
      accountType: 'SAVINGS',
    },
    {
      userId: 'user124',
      accountName: 'Education Fund',
      balance: 5000000,
      accountType: 'SAVINGS',
    },
  ];

  getAll(): Account[] {
    return this.accounts;
  }

  getAccount(param: GetAccountParam): Account {
    const account = this.accounts.find((acc) => acc.userId === param.userId);
    if (!account) throw new AccountNotFoundRepositoryException();
    return account;
  }

  createAccount(param: CreateAccountParam): Account {
    const newAccount: Account = {
      userId: (this.accounts.length + 1).toString(),
      accountName: param.accountName,
      balance: 0,
      accountType: param.accountType,
    };

    this.accounts.push(newAccount);
    return newAccount;
  }

  patchAccount(param: PatchAccountParam): Account {
    const account = this.accounts.find((acc) => acc.userId === param.userId);
    if (!account) throw new AccountNotFoundRepositoryException();

    account.accountName = param.accountName;
    account.balance = param.balance;

    return account;
  }

  deleteAccount(param: DeleteAccountParam): Account {
    const accountIndex = this.accounts.findIndex(
      (acc) => acc.userId === param.userId,
    );
    if (accountIndex === -1) throw new AccountNotFoundRepositoryException();

    const oldAcc = this.accounts[accountIndex];
    this.accounts.splice(accountIndex, 1);

    return oldAcc;
  }
}