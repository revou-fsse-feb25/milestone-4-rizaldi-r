import { Injectable } from '@nestjs/common';
import { Account, Prisma, Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private accountRepository: AccountsRepository,
    private transactionsRepository: TransactionsRepository,
  ) {}

  // TODO: add transfer between account

  async create(createData: {
    accountId: number;
    toAccountId?: number;
    amount: Prisma.Decimal;
    type: TransactionType;
    description?: string;
  }): Promise<Transaction> {
    const { accountId, amount, type, description, toAccountId } = createData;

    return this.prisma.$transaction(async () => {
      // find sender account
      const fromAccount: Account =
        await this.accountRepository.findById(accountId);
      if (!fromAccount) throw new Error('Account not found');

      // setup amount and balance variable
      const transactionAmount = new Prisma.Decimal(amount);
      let newBalance = new Prisma.Decimal(fromAccount.balance);

      let accountIdRelations: {
        fromAccountId?: number;
        toAccountId?: number;
      } = {};

      switch (type) {
        case TransactionType.DEPOSIT:
          // calculate balance and set account id
          newBalance = newBalance.plus(transactionAmount);
          accountIdRelations = { toAccountId: accountId };

          // update account balance
          await this.accountRepository.updateBalance(accountId, newBalance);
          break;

        case TransactionType.WITHDRAWAL:
          if (newBalance.lessThan(transactionAmount)) {
            throw new Error('Insufficient funds');
          }

          // calculate balance and set account id
          newBalance = newBalance.minus(transactionAmount);
          accountIdRelations = { fromAccountId: accountId };

          // update account balance
          await this.accountRepository.updateBalance(accountId, newBalance);
          break;

        case TransactionType.TRANSFER: {
          // check acccount id destination
          if (!toAccountId) {
            throw new Error('toAccountId is required for transfer');
          }
          if (accountId === toAccountId) {
            throw new Error('Cannot transfer to the same account');
          }

          // find account destination
          const toAccount = await this.accountRepository.findById(toAccountId);
          if (!toAccount) throw new Error('Recipient account not found');

          // check balance
          if (newBalance.lessThan(transactionAmount)) {
            throw new Error('Insufficient funds for transfer');
          }
          console.log('🚀 ~ toAccount:', toAccount.balance);

          // calculate balance and set account id
          newBalance = newBalance.minus(transactionAmount);
          const newToBalance = new Prisma.Decimal(toAccount.balance).plus(
            transactionAmount,
          );
          accountIdRelations = {
            fromAccountId: accountId,
            toAccountId,
          };

          // update accounts balance in db
          await this.accountRepository.updateBalance(accountId, newBalance);
          await this.accountRepository.updateBalance(toAccountId, newToBalance);

          break;
        }

        default:
          throw new Error('Invalid transaction type');
      }

      // create transaction in db
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

  // Get a transaction by ID
  async findById(id: number) {
    return await this.transactionsRepository.findById(id);
  }

  // Get all transactions for an account
  async findAllByAccountId(accountId: number) {
    return await this.transactionsRepository.findAllByAccountId(accountId);
  }

  // Get all transactions for a user across all their accounts
  async findAllByUserId(userId: number) {
    return await this.transactionsRepository.findAllByUserId(userId);
  }
}
