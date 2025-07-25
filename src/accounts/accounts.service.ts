import { Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { Account, AccountStatus, Prisma } from '@prisma/client';
import {
  AccountServiceItf,
  UserInputItf,
} from './types/accounts.service.interface';

@Injectable()
export class AccountsService implements AccountServiceItf {
  constructor(private accountRepository: AccountsRepository) {}

  private async generateAccountNumber(): Promise<string> {
    let accountNumber: string = '';
    let isUnique = false;

    // loop until generate unique number
    while (!isUnique) {
      // last 8 digits of timestamp + 6 random digits
      const timestamp = Date.now().toString();
      const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
      accountNumber = `${timestamp.substring(timestamp.length - 8)}${randomPart}`;

      // check if this account number already exists in the database
      const existingAccount =
        await this.accountRepository.findByAccountNumber(accountNumber);
      if (!existingAccount) {
        isUnique = true;
      }
    }

    return accountNumber;
  }

  async findAll(): Promise<Account[]> {
    return this.accountRepository.findAll();
  }

  async findAllByUserId(userId: number): Promise<Account[]> {
    return this.accountRepository.findAllByUserId(userId);
  }

  async findById(id: number): Promise<Account> {
    return this.accountRepository.findById(id);
  }

  async findAllWithTransactionsByUserId(userId: number) {
    return this.accountRepository.findAllWithTransactionsByUserId(userId);
  }

  async findAccountWithTransactions(id: number) {
    return this.accountRepository.findAccountWithTransactions(id);
  }

  // create(createAccountDto: CreateAccountDto) {
  async create(userId: number, userInput: UserInputItf): Promise<Account> {
    const finalInput = {
      ...userInput,
      accountNumber: await this.generateAccountNumber(),
      accountStatus: AccountStatus.ACTIVE,
    };
    return this.accountRepository.create(userId, finalInput);
  }

  async updateBalance(id: number, newBalance: Prisma.Decimal) {
    return this.accountRepository.updateBalance(id, newBalance);
  }

  async delete(id: number): Promise<Account> {
    return this.accountRepository.delete(id);
  }
}
