import { Injectable } from '@nestjs/common';
import { AccountNotFoundRepositoryException } from './exceptions/account-not-found.exception.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { Account, AccountStatus } from '@prisma/client';
import {
  ItfAccountRepository,
  UserInputItf,
} from './types/accounts.repository.interface';

@Injectable()
export class AccountRepository implements ItfAccountRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Account[]> {
    return await this.prisma.account.findMany();
  }

  async findAllByUserId(userId: number): Promise<Account[]> {
    return await this.prisma.account.findMany({
      where: { userId },
    });
  }

  async findById(id: number): Promise<Account> {
    const foundAccount = await this.prisma.account.findUnique({
      where: { id },
    });
    if (!foundAccount) throw new AccountNotFoundRepositoryException();
    return foundAccount;
  }

  async findByAccountNumber(accountNumber: string) {
    const foundAccount = await this.prisma.account.findUnique({
      where: { accountNumber },
    });
    // ISSUE: cant throw error bc it used to check if account number is uique by number generator
    // if (!foundAccount) throw new AccountNotFoundRepositoryException();
    return foundAccount;
  }

  async findAllWithTransactionsByUserId(userId: number) {
    return this.prisma.account.findMany({
      where: { userId },
      include: {
        from_transactions: true,
        to_transactions: true,
      },
    });
  }

  // TODO: add exception error
  async findAccountWithTransactions(id: number) {
    return this.prisma.account.findUnique({
      where: { id },
      include: {
        from_transactions: true,
        to_transactions: true,
      },
    });
  }

  async create(userId: number, userInput: UserInputItf): Promise<Account> {
    return await this.prisma.account.create({
      data: {
        ...userInput,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async updateBalance(id: number, newBalance: number) {
    return this.prisma.account.update({
      where: { id },
      data: { balance: { set: newBalance } },
    });
  }

  async updateStatus(id: number, status: AccountStatus) {
    return await this.prisma.account.update({
      where: { id },
      data: { accountStatus: status },
    });
  }

  async delete(id: number): Promise<Account> {
    const oldAccount = await this.prisma.account.delete({
      where: { id },
    });
    if (!oldAccount) throw new AccountNotFoundRepositoryException();
    return oldAccount;
  }
}
