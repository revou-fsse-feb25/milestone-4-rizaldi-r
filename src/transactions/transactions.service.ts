import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Account, Prisma, Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { TransactionsRepository } from './transactions.repository';
import { AccountsService } from 'src/accounts/accounts.service';
import { ResourceNotFoundException } from 'src/_common/exceptions/custom-not-found.exception';
import { UserService } from 'src/user/user.service';
import {
  CreateParamItf,
  TransactionsServiceItf,
} from './types/transactions.service.interface';

@Injectable()
export class TransactionsService implements TransactionsServiceItf {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private accountService: AccountsService,
    private accountRepository: AccountsRepository,
    private transactionsRepository: TransactionsRepository,
  ) {}

  private async _handleDeposit(
    account: Account,
    amount: Prisma.Decimal,
    prismaTransaction: Prisma.TransactionClient,
  ): Promise<{
    newBalance: Prisma.Decimal;
    accountIdRelations: { toAccountId: number };
  }> {
    const newBalance = new Prisma.Decimal(account.balance).plus(amount);
    await this.accountRepository.updateBalance(
      account.id,
      newBalance,
      prismaTransaction,
    );
    return {
      newBalance,
      accountIdRelations: { toAccountId: account.id },
    };
  }

  private async _handleWithdrawal(
    account: Account,
    amount: Prisma.Decimal,
    prismaTransaction: Prisma.TransactionClient,
  ): Promise<{
    newBalance: Prisma.Decimal;
    accountIdRelations: { fromAccountId: number };
  }> {
    if (new Prisma.Decimal(account.balance).lessThan(amount)) {
      throw new UnprocessableEntityException(
        'Insufficient funds for withdrawal',
      );
    }
    const newBalance = new Prisma.Decimal(account.balance).minus(amount);
    await this.accountRepository.updateBalance(
      account.id,
      newBalance,
      prismaTransaction,
    );
    return {
      newBalance,
      accountIdRelations: { fromAccountId: account.id },
    };
  }

  private async _handleTransfer(
    fromAccount: Account,
    toAccountId: number,
    amount: Prisma.Decimal,
    prismaTransaction: Prisma.TransactionClient,
  ): Promise<{
    newBalance: Prisma.Decimal;
    accountIdRelations: { fromAccountId: number; toAccountId: number };
  }> {
    if (fromAccount.id === toAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    // Find recipient account
    const toAccount = await this.accountRepository.findById(toAccountId);
    if (!toAccount) {
      throw new NotFoundException('Recipient account not found');
    }

    // Check sender's balance
    if (new Prisma.Decimal(fromAccount.balance).lessThan(amount)) {
      throw new UnprocessableEntityException('Insufficient funds for transfer');
    }

    const newFromBalance = new Prisma.Decimal(fromAccount.balance).minus(
      amount,
    );
    const newToBalance = new Prisma.Decimal(toAccount.balance).plus(amount);

    // Update both accounts' balances within the transaction
    await this.accountRepository.updateBalance(
      fromAccount.id,
      newFromBalance,
      prismaTransaction,
    );
    await this.accountRepository.updateBalance(
      toAccount.id,
      newToBalance,
      prismaTransaction,
    );

    return {
      newBalance: newFromBalance,
      accountIdRelations: {
        fromAccountId: fromAccount.id,
        toAccountId,
      },
    };
  }

  async create(createData: CreateParamItf): Promise<Transaction> {
    const { accountId, amount, type, description, toAccountId } = createData;

    return this.prisma.$transaction(async (prismaTransaction) => {
      const account = await this.accountService.findById(accountId);

      const transactionAmount = new Prisma.Decimal(amount);
      let accountIdRelations: {
        fromAccountId?: number;
        toAccountId?: number;
      } = {};

      switch (type) {
        case TransactionType.DEPOSIT:
          ({ accountIdRelations } = await this._handleDeposit(
            account,
            transactionAmount,
            prismaTransaction,
          ));
          break;

        case TransactionType.WITHDRAWAL:
          ({ accountIdRelations } = await this._handleWithdrawal(
            account,
            transactionAmount,
            prismaTransaction,
          ));
          break;

        case TransactionType.TRANSFER:
          if (!toAccountId) {
            throw new BadRequestException(
              'Recipient account ID (toAccountId) is required for transfer',
            );
          }
          ({ accountIdRelations } = await this._handleTransfer(
            account,
            toAccountId,
            transactionAmount,
            prismaTransaction,
          ));
          break;

        default:
          throw new BadRequestException('Invalid transaction type');
      }

      // Create transaction record in the database
      const createdTransaction = await this.transactionsRepository.create({
        amount,
        description,
        transactionType: type,
        transactionStatus: 'COMPLETED',
        ...accountIdRelations,
      });
      return createdTransaction;
    });
  }

  async findAll() {
    return await this.transactionsRepository.findAll();
  }

  async findById(id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction)
      throw new ResourceNotFoundException('Transaction', 'id', id);
    return transaction;
  }

  async findAllByAccountId(accountId: number) {
    await this.accountService.findById(accountId);
    return await this.transactionsRepository.findAllByAccountId(accountId);
  }

  async findAllByUserId(userId: number, accountId?: number) {
    await this.userService.findById(userId);
    return await this.transactionsRepository.findAllByUserId(userId, {
      accountId,
    });
  }
}
