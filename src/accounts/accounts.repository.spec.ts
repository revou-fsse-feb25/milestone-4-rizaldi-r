import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRepository } from './accounts.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Account, AccountStatus, Currency, Prisma } from '@prisma/client';

interface MockPrismaService {
  account: {
    findMany: jest.Mock<any, any, any>;
    findUnique: jest.Mock<any, any, any>;
    create: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    delete: jest.Mock<any, any, any>;
  };
  $transaction: jest.Mock;
}

// Mock PrismaService
const mockPrismaService: MockPrismaService = {
  account: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(
    (callback: (prisma: Prisma.TransactionClient) => Promise<any>) =>
      callback(mockPrismaService as unknown as Prisma.TransactionClient),
  ),
};

// Mock Prisma Transaction Client
const mockTransactionClientUpdate = jest.fn();
const mockTransactionClient = {
  account: {
    update: mockTransactionClientUpdate,
  },
} as unknown as Prisma.TransactionClient;

describe('AccountsRepository', () => {
  let repository: AccountsRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AccountsRepository>(AccountsRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // Reset all mocks after each test
    for (const key in mockPrismaService.account) {
      if (
        Object.prototype.hasOwnProperty.call(mockPrismaService.account, key)
      ) {
        (mockPrismaService.account[key] as jest.Mock).mockReset();
      }
    }
    mockPrismaService.$transaction.mockReset();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of accounts', async () => {
      const accounts: Account[] = [
        {
          id: 1,
          userId: 1,
          accountName: 'Savings',
          accountNumber: '12345678901234',
          accountStatus: AccountStatus.ACTIVE,
          currency: Currency.USD,
          balance: new Prisma.Decimal(1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.account.findMany.mockResolvedValue(accounts);

      expect(await repository.findAll()).toEqual(accounts);
      expect(mockPrismaService.account.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllByUserId', () => {
    const userId = 1;
    const accounts: Account[] = [
      {
        id: 1,
        userId: userId,
        accountName: 'Savings',
        accountNumber: '12345678901234',
        accountStatus: AccountStatus.ACTIVE,
        currency: Currency.USD,
        balance: new Prisma.Decimal(1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return an array of accounts for a given user ID', async () => {
      mockPrismaService.account.findMany.mockResolvedValue(accounts);

      expect(await repository.findAllByUserId(userId)).toEqual(accounts);
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('findById', () => {
    const accountId = 1;
    const account: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.USD,
      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an account if found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(account);

      expect(await repository.findById(accountId)).toEqual(account);
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });

    it('should return null if account is not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      expect(await repository.findById(accountId)).toBeNull();
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });
  });

  describe('findByAccountNumber', () => {
    const accountNumber = '12345678901234';
    const account: Account = {
      id: 1,
      userId: 1,
      accountName: 'Savings',
      accountNumber: accountNumber,
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.USD,

      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an account if found by account number', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(account);

      expect(await repository.findByAccountNumber(accountNumber)).toEqual(
        account,
      );
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { accountNumber },
      });
    });

    it('should return null if account is not found by account number', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      expect(await repository.findByAccountNumber(accountNumber)).toBeNull();
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { accountNumber },
      });
    });
  });

  describe('findByAccountName', () => {
    const accountName = 'My Checking';
    const account: Account = {
      id: 1,
      userId: 1,
      accountName: accountName,
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.USD,
      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an account if found by account name', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(account);

      expect(await repository.findByAccountName(accountName)).toEqual(account);
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { accountName },
      });
    });

    it('should return null if account is not found by account name', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      expect(await repository.findByAccountName(accountName)).toBeNull();
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { accountName },
      });
    });
  });

  describe('findAllWithTransactionsByUserId', () => {
    const userId = 1;
    const accountsWithTransactions: any[] = [
      {
        id: 1,
        accountName: 'Savings',
        from_transactions: [{ id: 101 }],
        to_transactions: [],
      },
    ];

    it('should return accounts with transactions for a given user ID', async () => {
      mockPrismaService.account.findMany.mockResolvedValue(
        accountsWithTransactions,
      );

      expect(await repository.findAllWithTransactionsByUserId(userId)).toEqual(
        accountsWithTransactions,
      );
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          from_transactions: true,
          to_transactions: true,
        },
      });
    });
  });

  describe('findAccountWithTransactions', () => {
    const accountId = 1;
    const accountWithTransactions: any = {
      id: accountId,
      accountName: 'Savings',
      from_transactions: [{ id: 101 }],
      to_transactions: [],
    };

    it('should return an account with transactions if found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(
        accountWithTransactions,
      );

      expect(await repository.findAccountWithTransactions(accountId)).toEqual(
        accountWithTransactions,
      );
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        include: {
          from_transactions: true,
          to_transactions: true,
        },
      });
    });

    it('should return null if account with transactions is not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      expect(
        await repository.findAccountWithTransactions(accountId),
      ).toBeNull();
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        include: {
          from_transactions: true,
          to_transactions: true,
        },
      });
    });
  });

  describe('create', () => {
    const userId = 1;
    const userInput = {
      accountName: 'New Account',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      balance: new Prisma.Decimal(0),
      currency: Currency.USD, // Assuming currency is part of CreateParamItf
    };
    const createdAccount: Account = {
      id: 1,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userInput,
    };

    it('should successfully create a new account', async () => {
      mockPrismaService.account.create.mockResolvedValue(createdAccount);

      expect(await repository.create(userId, userInput)).toEqual(
        createdAccount,
      );
      expect(mockPrismaService.account.create).toHaveBeenCalledWith({
        data: {
          ...userInput,
          user: {
            connect: { id: userId },
          },
        },
      });
    });
  });

  describe('update', () => {
    const accountId = 1;
    const updateData = {
      accountName: 'Updated Name',
      accountStatus: AccountStatus.INACTIVE,
    };
    const updatedAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Updated Name',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.INACTIVE,
      currency: Currency.USD,
      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully update an account', async () => {
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);
      expect(await repository.update(accountId, updateData)).toEqual(
        updatedAccount,
      );
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { ...updateData },
      });
    });

    it('should use prismaTransaction if provided', async () => {
      mockTransactionClientUpdate.mockResolvedValue(updatedAccount);
      expect(
        await repository.update(accountId, updateData, mockTransactionClient),
      ).toEqual(updatedAccount);
      expect(mockTransactionClientUpdate).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { ...updateData },
      });
      expect(mockPrismaService.account.update).not.toHaveBeenCalled();
    });
  });

  describe('updateBalance', () => {
    const accountId = 1;
    const newBalance = new Prisma.Decimal(2000);
    const updatedAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.USD,
      balance: newBalance,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully update the account balance', async () => {
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);

      expect(await repository.updateBalance(accountId, newBalance)).toEqual(
        updatedAccount,
      );
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { balance: newBalance },
      });
    });

    it('should use prismaTransaction if provided', async () => {
      mockTransactionClientUpdate.mockResolvedValue(updatedAccount);

      expect(
        await repository.updateBalance(
          accountId,
          newBalance,
          mockTransactionClient,
        ),
      ).toEqual(updatedAccount);
      expect(mockTransactionClientUpdate).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { balance: newBalance },
      });
      expect(mockPrismaService.account.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    const accountId = 1;
    const newStatus = AccountStatus.INACTIVE;
    const updatedAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: newStatus,
      currency: Currency.USD,
      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully update the account status', async () => {
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);

      expect(await repository.updateStatus(accountId, newStatus)).toEqual(
        updatedAccount,
      );
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { accountStatus: newStatus },
      });
    });
  });

  describe('delete', () => {
    const accountId = 1;
    const deletedAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.USD,
      balance: new Prisma.Decimal(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully delete an account', async () => {
      mockPrismaService.account.delete.mockResolvedValue(deletedAccount);

      expect(await repository.delete(accountId)).toEqual(deletedAccount);
      expect(mockPrismaService.account.delete).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });
  });
});
