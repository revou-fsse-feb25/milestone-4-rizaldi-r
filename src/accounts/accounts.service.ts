import { Injectable } from '@nestjs/common';
import { AccountRepository } from './accounts.repository';
import { Account } from './entities/account.entity';
import {
  AccountsServiceItf,
  CreateAccountParam,
  DeleteAccountParam,
  GetAccountParam,
  PatchAccountParam,
} from './accounts.service.interface';

@Injectable()
export class AccountsService implements AccountsServiceItf {
  constructor(private repo: AccountRepository) {}

  findAll(): Account[] {
    return this.repo.getAll();
  }

  findOne(param: GetAccountParam): Account {
    return this.repo.getAccount({ userId: param.userId });
  }

  // create(createAccountDto: CreateAccountDto) {
  createAccount(param: CreateAccountParam): Account {
    return this.repo.createAccount({
      accountName: param.accountName,
      accountType: param.accountType,
    });
  }

  patchAccount(param: PatchAccountParam) {
    return this.repo.patchAccount({
      userId: param.userId,
      accountName: param.accountName,
      balance: param.balance,
    });
  }

  deleteAccount(param: DeleteAccountParam) {
    return this.repo.deleteAccount({
      userId: param.userId,
    });
  }
}
