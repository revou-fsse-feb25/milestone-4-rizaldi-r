import { Injectable } from '@nestjs/common';
import { Account, AccountStatus, Prisma } from '@prisma/client';
import {
  CreateParamItf,
  ItfAccountsRepository,
  AccountWithTransactionType,
  UpdateParamItf,
} from './types/accounts.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsRepository implements ItfAccountsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Account[]> {
    return await this.prisma.account.findMany();
  }

  async findAllByUserId(
    userId: number,
    // selectedField?: Partial<Record<keyof Account, boolean>>,
  ): Promise<Account[]> {
    return await this.prisma.account.findMany({
      where: { userId },
      // select: { id: true, userId: true },
    });
  }

  async findById(id: number): Promise<Account | null> {
    const foundAccount = await this.prisma.account.findUnique({
      where: { id },
    });
    return foundAccount;
  }

  async findByAccountNumber(accountNumber: string) {
    const foundAccount = await this.prisma.account.findUnique({
      where: { accountNumber },
    });
    return foundAccount;
  }

  async findByAccountName(accountName: string) {
    const foundAccount = await this.prisma.account.findUnique({
      where: { accountName },
    });
    return foundAccount;
  }

  async findAllWithTransactionsByUserId(
    userId: number,
  ): Promise<AccountWithTransactionType[]> {
    return await this.prisma.account.findMany({
      where: { userId },
      include: {
        from_transactions: true,
        to_transactions: true,
      },
    });
  }

  async findAccountWithTransactions(id: number) {
    return await this.prisma.account.findUnique({
      where: { id },
      include: {
        from_transactions: true,
        to_transactions: true,
      },
    });
  }

  async create(userId: number, userInput: CreateParamItf): Promise<Account> {
    return await this.prisma.account.create({
      data: {
        ...userInput,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async update(
    id: number,
    updateData: UpdateParamItf,
    prismaTransaction?: Prisma.TransactionClient,
  ) {
    const client = prismaTransaction || this.prisma;
    return await client.account.update({
      where: { id },
      data: { ...updateData },
    });
  }

  async updateBalance(
    id: number,
    newBalance: Prisma.Decimal,
    prismaTransaction?: Prisma.TransactionClient,
  ) {
    const client = prismaTransaction || this.prisma;
    return await client.account.update({
      where: { id },
      data: { balance: newBalance },
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
    return oldAccount;
  }
}
