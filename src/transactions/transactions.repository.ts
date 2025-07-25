import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionsRepository {
  constructor(
    private prisma: PrismaService,
    private accountRepository: AccountsRepository,
  ) {}

  async create(createData: {
    amount: Prisma.Decimal;
    description?: string;
    transactionType: TransactionType;
    transactionStatus: TransactionStatus;
    fromAccountId?: number | null;
    toAccountId?: number | null;
  }): Promise<Transaction> {
    const { fromAccountId, toAccountId, ...transactionData } = createData;
    const data: Prisma.TransactionCreateInput = { ...transactionData };

    // check if both account id exist
    if (fromAccountId) data.fromAccount = { connect: { id: fromAccountId } };
    if (toAccountId) data.toAccount = { connect: { id: toAccountId } };

    return this.prisma.transaction.create({ data });
  }

  async findAll() {
    return this.prisma.transaction.findMany();
  }

  async findById(id: number) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        toAccount: true,
        fromAccount: true,
      },
    });
  }

  async findAllByAccountId(accountId: number) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
      include: {
        toAccount: true,
        fromAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUserId(userId: number) {
    // get all accounts for the user
    const accounts = await this.accountRepository.findAllByUserId(userId);
    const accountIds = accounts.map((account) => account.id);

    // Then get all transactions for those accounts
    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
      include: {
        toAccount: true,
        fromAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
