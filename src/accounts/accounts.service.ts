import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { Account, AccountStatus, Prisma } from '@prisma/client';
import {
  AccountServiceItf,
  CreateParamItf,
  AccountWithTransactionType,
  UpdateParamItf,
} from './types/accounts.service.interface';
import { ResourceNotFoundException } from 'src/_common/exceptions/custom-not-found.exception';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AccountsService implements AccountServiceItf {
  constructor(
    private accountRepository: AccountsRepository,
    private userService: UserService,
  ) {}

  private async generateAccountNumber(): Promise<string> {
    let accountNumber: string = '';
    let isUnique = false;

    // loop until generate unique number
    while (!isUnique) {
      // last 8 digits of timestamp + 6 random digits
      const timestamp = Date.now().toString();
      const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
      accountNumber = `${timestamp.substring(timestamp.length - 8)}${randomPart}`;

      // check if account number already exists
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

  // check user id with service
  async findAllByUserId(userId: number): Promise<Account[]> {
    await this.userService.findById(userId);
    return await this.accountRepository.findAllByUserId(userId);
  }

  async findById(id: number): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new ResourceNotFoundException('Account', 'id', id);
    return account;
  }

  async findAllWithTransactionsByUserId(
    userId: number,
  ): Promise<AccountWithTransactionType[]> {
    await this.userService.findById(userId);
    return await this.accountRepository.findAllWithTransactionsByUserId(userId);
  }

  async findAccountWithTransactions(id: number) {
    await this.findById(id);
    return await this.accountRepository.findAccountWithTransactions(id);
  }

  async create(userId: number, userInput: CreateParamItf): Promise<Account> {
    await this.userService.findById(userId);

    // is account already exist
    const existingAccount = await this.accountRepository.findByAccountName(
      userInput.accountName,
    );
    if (existingAccount)
      throw new ConflictException('Account name already exist');

    // update db
    const finalInput = {
      ...userInput,
      accountNumber: await this.generateAccountNumber(),
      accountStatus: AccountStatus.ACTIVE,
      balance: new Prisma.Decimal(0),
    };
    return await this.accountRepository.create(userId, finalInput);
  }

  async update(id: number, updateParam: UpdateParamItf) {
    await this.findById(id);
    if (updateParam.accountName) {
      const existingAccount = await this.accountRepository.findByAccountName(
        updateParam.accountName,
      );
      if (existingAccount)
        throw new ConflictException('Account name already exist');
    }

    return await this.accountRepository.update(id, updateParam);
  }

  async updateBalance(id: number, newBalance: Prisma.Decimal) {
    await this.findById(id);
    return await this.accountRepository.updateBalance(id, newBalance);
  }

  async delete(id: number): Promise<Account> {
    const account = await this.findById(id);
    if (new Prisma.Decimal(account.balance).greaterThan(0))
      throw new BadRequestException(
        'Account balance must be zero before deletion.',
      );
    return await this.accountRepository.delete(id);
  }
}
