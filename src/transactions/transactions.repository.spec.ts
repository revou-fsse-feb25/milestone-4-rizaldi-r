import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { TransactionsRepository } from './transactions.repository';
import {
  Account,
  AccountStatus,
  Currency,
  Prisma,
  Transaction,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';

// Mock Prisma client methods
const mockPrismaService = {
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

// Mock AccountsRepository methods
const mockAccountsRepository = {
  findAllByUserId: jest.fn(),
};

// Mock data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  firstName: 'Test',
  lastName: 'User',
  userRole: UserRole.CUSTOMER,
  refreshToken: null,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAccount: Account = {
  id: 101,
  userId: mockUser.id,
  currency: Currency.USD,
  accountStatus: AccountStatus.ACTIVE,
  accountName: 'Savings',
  accountNumber: '1234567890',
  balance: new Prisma.Decimal('500.00'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAccount2: Account = {
  id: 102,
  userId: mockUser.id,
  currency: Currency.USD,
  accountStatus: AccountStatus.ACTIVE,
  accountName: 'Checking',
  accountNumber: '0987654321',
  balance: new Prisma.Decimal('1200.00'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransaction: Transaction = {
  id: 1,
  amount: new Prisma.Decimal('100.00'),
  transactionType: TransactionType.DEPOSIT,
  description: 'Test Deposit',
  fromAccountId: null,
  toAccountId: mockAccount.id,
  transactionDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  transactionStatus: TransactionStatus.COMPLETED,
};

const mockWithdrawalTransaction: Transaction = {
  id: 2,
  amount: new Prisma.Decimal('50.00'),
  transactionType: TransactionType.WITHDRAWAL,
  description: 'Test Withdrawal',
  fromAccountId: mockAccount.id,
  toAccountId: null,
  transactionDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  transactionStatus: TransactionStatus.COMPLETED,
};

const mockTransferTransaction: Transaction = {
  id: 3,
  amount: new Prisma.Decimal('75.00'),
  transactionType: TransactionType.TRANSFER,
  description: 'Test Transfer',
  fromAccountId: mockAccount.id,
  toAccountId: mockAccount2.id,
  transactionDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  transactionStatus: TransactionStatus.COMPLETED,
};

describe('TransactionsRepository', () => {
  let repository: TransactionsRepository;
  let prisma: PrismaService;
  let accountRepository: AccountsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsRepository,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AccountsRepository, useValue: mockAccountsRepository },
      ],
    }).compile();

    repository = module.get<TransactionsRepository>(TransactionsRepository);
    prisma = module.get<PrismaService>(PrismaService);
    accountRepository = module.get<AccountsRepository>(AccountsRepository);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(prisma).toBeDefined();
    expect(accountRepository).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction with toAccountId (deposit)', async () => {
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const createData = {
        amount: new Prisma.Decimal('100.00'),
        description: 'Test Deposit',
        transactionType: TransactionType.DEPOSIT,
        transactionStatus: TransactionStatus.COMPLETED,
        toAccountId: mockAccount.id,
      };

      const result = await repository.create(createData);

      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: createData.amount,
          description: createData.description,
          transactionType: createData.transactionType,
          transactionStatus: createData.transactionStatus,
          toAccount: { connect: { id: createData.toAccountId } },
        },
      });
    });

    it('should create a transaction with fromAccountId (withdrawal)', async () => {
      mockPrismaService.transaction.create.mockResolvedValue(
        mockWithdrawalTransaction,
      );

      const createData = {
        amount: new Prisma.Decimal('50.00'),
        description: 'Test Withdrawal',
        transactionType: TransactionType.WITHDRAWAL,
        transactionStatus: TransactionStatus.COMPLETED,
        fromAccountId: mockAccount.id,
      };

      const result = await repository.create(createData);

      expect(result).toEqual(mockWithdrawalTransaction);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: createData.amount,
          description: createData.description,
          transactionType: createData.transactionType,
          transactionStatus: createData.transactionStatus,
          fromAccount: { connect: { id: createData.fromAccountId } },
        },
      });
    });

    it('should create a transaction with both fromAccountId and toAccountId (transfer)', async () => {
      mockPrismaService.transaction.create.mockResolvedValue(
        mockTransferTransaction,
      );

      const createData = {
        amount: new Prisma.Decimal('75.00'),
        description: 'Test Transfer',
        transactionType: TransactionType.TRANSFER,
        transactionStatus: TransactionStatus.COMPLETED,
        fromAccountId: mockAccount.id,
        toAccountId: mockAccount2.id,
      };

      const result = await repository.create(createData);

      expect(result).toEqual(mockTransferTransaction);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: createData.amount,
          description: createData.description,
          transactionType: createData.transactionType,
          transactionStatus: createData.transactionStatus,
          fromAccount: { connect: { id: createData.fromAccountId } },
          toAccount: { connect: { id: createData.toAccountId } },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of all transactions', async () => {
      const expectedTransactions = [
        mockTransaction,
        mockWithdrawalTransaction,
        mockTransferTransaction,
      ];
      mockPrismaService.transaction.findMany.mockResolvedValue(
        expectedTransactions,
      );

      const result = await repository.findAll();
      expect(result).toEqual(expectedTransactions);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no transactions are found', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await repository.findAll();
      expect(result).toEqual([]);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a transaction if found by ID', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(
        mockTransaction,
      );

      const result = await repository.findById(mockTransaction.id);
      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        include: {
          toAccount: true,
          fromAccount: true,
        },
      });
    });

    it('should return null if transaction is not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);
      expect(result).toBeNull();
      expect(mockPrismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          toAccount: true,
          fromAccount: true,
        },
      });
    });
  });

  describe('findAllByAccountId', () => {
    it('should return transactions for a given account ID', async () => {
      const expectedTransactions = [mockTransaction, mockWithdrawalTransaction];
      mockPrismaService.transaction.findMany.mockResolvedValue(
        expectedTransactions,
      );

      const result = await repository.findAllByAccountId(mockAccount.id);
      expect(result).toEqual(expectedTransactions);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fromAccountId: mockAccount.id },
            { toAccountId: mockAccount.id },
          ],
        },
        include: {
          toAccount: true,
          fromAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return an empty array if no transactions are found for the account', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await repository.findAllByAccountId(999);
      expect(result).toEqual([]);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ fromAccountId: 999 }, { toAccountId: 999 }],
        },
        include: {
          toAccount: true,
          fromAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findAllByUserId', () => {
    it('should return transactions for a given user ID (all accounts)', async () => {
      mockAccountsRepository.findAllByUserId.mockResolvedValue([
        mockAccount,
        mockAccount2,
      ]);
      const expectedTransactions = [mockTransaction, mockTransferTransaction];
      mockPrismaService.transaction.findMany.mockResolvedValue(
        expectedTransactions,
      );

      const result = await repository.findAllByUserId(mockUser.id);
      expect(result).toEqual(expectedTransactions);
      expect(mockAccountsRepository.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fromAccountId: { in: [mockAccount.id, mockAccount2.id] } },
            { toAccountId: { in: [mockAccount.id, mockAccount2.id] } },
          ],
        },
        include: {
          toAccount: true,
          fromAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return transactions for a given user ID and specific account ID filter', async () => {
      mockAccountsRepository.findAllByUserId.mockResolvedValue([
        mockAccount,
        mockAccount2,
      ]);
      const expectedTransactions = [mockTransaction];
      mockPrismaService.transaction.findMany.mockResolvedValue(
        expectedTransactions,
      );

      const result = await repository.findAllByUserId(mockUser.id, {
        accountId: mockAccount.id,
      });
      expect(result).toEqual(expectedTransactions);
      expect(mockAccountsRepository.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fromAccountId: { in: [mockAccount.id] } }, // Only mockAccount.id should be in the filter
            { toAccountId: { in: [mockAccount.id] } },
          ],
        },
        include: {
          toAccount: true,
          fromAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return an empty array if user has no accounts', async () => {
      mockAccountsRepository.findAllByUserId.mockResolvedValue([]);
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await repository.findAllByUserId(mockUser.id);
      expect(result).toEqual([]);
      expect(mockAccountsRepository.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ fromAccountId: { in: [] } }, { toAccountId: { in: [] } }],
        },
        include: {
          toAccount: true,
          fromAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return an empty array if no transactions are found for the user', async () => {
      mockAccountsRepository.findAllByUserId.mockResolvedValue([mockAccount]);
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await repository.findAllByUserId(mockUser.id);
      expect(result).toEqual([]);
      expect(mockAccountsRepository.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fromAccountId: { in: [mockAccount.id] } },
            { toAccountId: { in: [mockAccount.id] } },
          ],
        },
        include: {
          toAccount: true,
          fromAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
