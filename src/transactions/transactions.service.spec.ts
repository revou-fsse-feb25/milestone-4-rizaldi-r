import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { TransactionsRepository } from './transactions.repository';
import { AccountsService } from 'src/accounts/accounts.service';
import { UserService } from 'src/user/user.service';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Account,
  AccountStatus,
  Currency,
  Prisma,
  Transaction,
  TransactionType,
  User,
  UserRole,
} from '@prisma/client';
import { ResourceNotFoundException } from 'src/_common/exceptions/custom-not-found.exception';

interface mockAccountsRepositoryItf {
  findById: jest.Mock<any, any, any>;
  updateBalance: jest.Mock<any, any, any>;
}

// Mock the dependencies
const mockPrismaService: { $transaction: jest.Mock } = {
  $transaction: jest.fn(
    (callback: (prismaTransaction: Prisma.TransactionClient) => Promise<any>) =>
      callback(mockPrismaService as unknown as Prisma.TransactionClient),
  ),
};

const mockUserService = {
  findById: jest.fn(),
};

const mockAccountsService = {
  findById: jest.fn(),
};

const mockAccountsRepository: mockAccountsRepositoryItf = {
  findById: jest.fn(),
  updateBalance: jest.fn(),
};

const mockTransactionsRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findAllByAccountId: jest.fn(),
  findAllByUserId: jest.fn(),
  create: jest.fn(),
};

// Mock data
const mockUser: User = {
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

const mockTransferTransaction: Transaction & {
  fromAccount: Account;
  toAccount: Account;
} = {
  id: 2,
  amount: new Prisma.Decimal('50'),
  transactionType: TransactionType.TRANSFER,
  description: 'Transfer',
  transactionStatus: 'COMPLETED',
  fromAccountId: mockAccount.id,
  toAccountId: mockAccount2.id,
  transactionDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  fromAccount: mockAccount,
  toAccount: mockAccount2,
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
  transactionStatus: 'COMPLETED',
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;
  let userService: UserService;
  let accountsService: AccountsService;
  let accountsRepository: AccountsRepository;
  let transactionsRepository: TransactionsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserService, useValue: mockUserService },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: AccountsRepository, useValue: mockAccountsRepository },
        {
          provide: TransactionsRepository,
          useValue: mockTransactionsRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);
    userService = module.get<UserService>(UserService);
    accountsService = module.get<AccountsService>(AccountsService);
    accountsRepository = module.get<AccountsRepository>(AccountsRepository);
    transactionsRepository = module.get<TransactionsRepository>(
      TransactionsRepository,
    );

    // reset all mocks
    jest.clearAllMocks();
    // default to null
    mockAccountsRepository.findById.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
    expect(userService).toBeDefined();
    expect(accountsService).toBeDefined();
    expect(accountsRepository).toBeDefined();
    expect(transactionsRepository).toBeDefined();
  });

  describe('create', () => {
    // Shared setup for create tests
    const commonCreateMocks = () => {
      mockAccountsService.findById.mockResolvedValue(mockAccount);
      mockTransactionsRepository.create.mockResolvedValue(mockTransaction);
      mockAccountsRepository.updateBalance.mockResolvedValue(true);
    };

    it('should successfully create a DEPOSIT transaction', async () => {
      commonCreateMocks();
      const createData = {
        accountId: mockAccount.id,
        amount: new Prisma.Decimal('100'),
        type: TransactionType.DEPOSIT,
        description: 'Salary Deposit',
      };

      const result = await service.create(createData);

      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockAccountsService.findById).toHaveBeenCalledWith(mockAccount.id);
      expect(mockAccountsRepository.updateBalance).toHaveBeenCalledWith(
        mockAccount.id,
        expect.any(Prisma.Decimal),
        expect.any(Object),
      );
      expect(
        (
          mockAccountsRepository.updateBalance.mock // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .calls[0][1] as Prisma.Decimal
        ).toString(),
      ).toBe('600');
      expect(mockTransactionsRepository.create).toHaveBeenCalledWith({
        amount: createData.amount,
        description: createData.description,
        transactionType: TransactionType.DEPOSIT,
        transactionStatus: 'COMPLETED',
        toAccountId: mockAccount.id,
      });
    });

    it('should successfully create a WITHDRAWAL transaction', async () => {
      commonCreateMocks();
      const createData = {
        accountId: mockAccount.id,
        amount: new Prisma.Decimal('50'),
        type: TransactionType.WITHDRAWAL,
        description: 'Groceries',
      };

      const result = await service.create(createData);

      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockAccountsService.findById).toHaveBeenCalledWith(mockAccount.id);
      expect(mockAccountsRepository.updateBalance).toHaveBeenCalledWith(
        mockAccount.id,
        expect.any(Prisma.Decimal),
        expect.any(Object),
      );
      expect(
        (
          mockAccountsRepository.updateBalance.mock // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .calls[0][1] as Prisma.Decimal
        ).toString(),
      ).toBe('450');
      expect(mockTransactionsRepository.create).toHaveBeenCalledWith({
        amount: createData.amount,
        description: createData.description,
        transactionType: TransactionType.WITHDRAWAL,
        transactionStatus: 'COMPLETED',
        fromAccountId: mockAccount.id,
      });
    });

    it('should throw UnprocessableEntityException for insufficient funds on WITHDRAWAL', async () => {
      commonCreateMocks();
      const createData = {
        accountId: mockAccount.id,
        amount: new Prisma.Decimal('600'),
        type: TransactionType.WITHDRAWAL,
        description: 'Too much',
      };

      await expect(service.create(createData)).rejects.toThrow(
        UnprocessableEntityException,
      );
      await expect(service.create(createData)).rejects.toThrow(
        'Insufficient funds for withdrawal',
      );
      expect(mockAccountsRepository.updateBalance).not.toHaveBeenCalled();
      expect(mockTransactionsRepository.create).not.toHaveBeenCalled();
    });

    it('should successfully create a TRANSFER transaction', async () => {
      mockAccountsService.findById.mockResolvedValue(mockAccount); // fromAccount
      mockAccountsRepository.findById.mockResolvedValue(mockAccount2); // toAccount
      mockTransactionsRepository.create.mockResolvedValue(mockTransaction);
      mockAccountsRepository.updateBalance.mockResolvedValue(true);
      const createData = {
        accountId: mockAccount.id,
        toAccountId: mockAccount2.id,
        amount: new Prisma.Decimal('100'),
        type: TransactionType.TRANSFER,
        description: 'Transfer to checking',
      };

      const result = await service.create(createData);

      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockAccountsService.findById).toHaveBeenCalledWith(mockAccount.id);
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(
        mockAccount2.id,
      );
      expect(mockAccountsRepository.updateBalance).toHaveBeenCalledTimes(2);
      expect(mockAccountsRepository.updateBalance).toHaveBeenCalledWith(
        mockAccount.id,
        expect.any(Prisma.Decimal),
        expect.any(Object),
      );
      expect(
        // [0] first call, [1] second arg from first call
        (
          mockAccountsRepository.updateBalance.mock // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .calls[0][1] as Prisma.Decimal
        ).toString(),
      ).toBe('400');
      expect(mockAccountsRepository.updateBalance).toHaveBeenCalledWith(
        mockAccount2.id,
        expect.any(Prisma.Decimal),
        expect.any(Object),
      );
      expect(
        (
          mockAccountsRepository.updateBalance.mock // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .calls[1][1] as Prisma.Decimal
        ).toString(),
      ).toBe('1300');
      expect(mockTransactionsRepository.create).toHaveBeenCalledWith({
        amount: createData.amount,
        description: createData.description,
        transactionType: TransactionType.TRANSFER,
        transactionStatus: 'COMPLETED',
        fromAccountId: mockAccount.id,
        toAccountId: mockAccount2.id,
      });
    });

    it('should throw BadRequestException if toAccountId is missing for TRANSFER', async () => {
      commonCreateMocks();
      const createData = {
        accountId: mockAccount.id,
        amount: new Prisma.Decimal('100'),
        type: TransactionType.TRANSFER,
        description: 'Missing recipient',
        toAccountId: undefined,
      };

      await expect(service.create(createData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createData)).rejects.toThrow(
        'Recipient account ID (toAccountId) is required for transfer',
      );
      expect(mockAccountsRepository.updateBalance).not.toHaveBeenCalled();
      expect(mockTransactionsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if transferring to the same account', async () => {
      commonCreateMocks();
      const createData = {
        accountId: mockAccount.id,
        toAccountId: mockAccount.id,
        amount: new Prisma.Decimal('100'),
        type: TransactionType.TRANSFER,
        description: 'Self transfer',
      };

      await expect(service.create(createData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createData)).rejects.toThrow(
        'Cannot transfer to the same account',
      );
      expect(mockAccountsRepository.updateBalance).not.toHaveBeenCalled();
      expect(mockTransactionsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if recipient account not found for TRANSFER', async () => {
      mockAccountsService.findById.mockResolvedValue(mockAccount); // fromAccount

      // already set up to null in beforeach as default
      // mockAccountsRepository.findById.mockResolvedValueOnce(null); // toAccount not found

      const createData2 = {
        accountId: mockAccount.id,
        toAccountId: 999, // Non-existent
        amount: new Prisma.Decimal('100'),
        type: TransactionType.TRANSFER,
        description: 'Transfer to non-existent',
      };

      await expect(service.create(createData2)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createData2)).rejects.toThrow(
        'Recipient account not found',
      );
      expect(mockAccountsRepository.updateBalance).not.toHaveBeenCalled();
      expect(mockTransactionsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException for insufficient funds on TRANSFER', async () => {
      commonCreateMocks();
      mockAccountsRepository.findById.mockResolvedValueOnce(mockAccount); // fromAccount
      mockAccountsRepository.findById.mockResolvedValueOnce(mockAccount2); // toAccount
      const createData = {
        accountId: mockAccount.id,
        toAccountId: mockAccount2.id,
        amount: new Prisma.Decimal('600'),
        type: TransactionType.TRANSFER,
        description: 'Too much transfer',
      };

      await expect(service.create(createData)).rejects.toThrow(
        UnprocessableEntityException,
      );
      await expect(service.create(createData)).rejects.toThrow(
        'Insufficient funds for transfer',
      );
      expect(mockAccountsRepository.updateBalance).not.toHaveBeenCalled();
      expect(mockTransactionsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid transaction type', async () => {
      commonCreateMocks();
      const createData = {
        accountId: mockAccount.id,
        amount: new Prisma.Decimal('100'),
        type: 'INVALID_TYPE' as TransactionType, // Invalid type
        description: 'Invalid',
      };

      await expect(service.create(createData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createData)).rejects.toThrow(
        'Invalid transaction type',
      );
      expect(mockAccountsRepository.updateBalance).not.toHaveBeenCalled();
      expect(mockTransactionsRepository.create).not.toHaveBeenCalled();
    });

    it('should re-throw error if transaction fails (e.g., Prisma error)', async () => {
      mockAccountsService.findById.mockResolvedValue(mockAccount);
      mockTransactionsRepository.create.mockRejectedValue(
        new Error('Database connection lost'),
      );

      const createData = {
        accountId: mockAccount.id,
        amount: new Prisma.Decimal('100'),
        type: TransactionType.DEPOSIT,
        description: 'Failing deposit',
      };

      await expect(service.create(createData)).rejects.toThrow(
        'Database connection lost',
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // --- findAll method tests ---
  describe('findAll', () => {
    it('should return an array of all transactions', async () => {
      const expectedTransactions = [
        mockTransaction,
        { ...mockTransaction, id: 2, type: TransactionType.WITHDRAWAL },
      ];
      mockTransactionsRepository.findAll.mockResolvedValue(
        expectedTransactions,
      );

      const result = await service.findAll();
      expect(result).toEqual(expectedTransactions);
      expect(mockTransactionsRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no transactions are found', async () => {
      mockTransactionsRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(mockTransactionsRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // --- findById method tests ---
  describe('findById', () => {
    it('should return a transaction if found by ID', async () => {
      mockTransactionsRepository.findById.mockResolvedValue(mockTransaction);

      const result = await service.findById(mockTransaction.id);
      expect(result).toEqual(mockTransaction);
      expect(mockTransactionsRepository.findById).toHaveBeenCalledWith(
        mockTransaction.id,
      );
    });

    it('should throw ResourceNotFoundException if transaction is not found', async () => {
      mockTransactionsRepository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
      await expect(service.findById(999)).rejects.toThrow(
        'Transaction with id 999 not found.',
      );
      expect(mockTransactionsRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('findAllByAccountId', () => {
    it('should return transactions for a given account ID', async () => {
      const expectedTransactions = [mockTransaction];
      mockAccountsService.findById.mockResolvedValue(mockAccount);
      mockTransactionsRepository.findAllByAccountId.mockResolvedValue(
        expectedTransactions,
      );

      const result = await service.findAllByAccountId(mockAccount.id);
      expect(result).toEqual(expectedTransactions);
      expect(mockAccountsService.findById).toHaveBeenCalledWith(mockAccount.id);
      expect(
        mockTransactionsRepository.findAllByAccountId,
      ).toHaveBeenCalledWith(mockAccount.id);
    });

    it('should throw ResourceNotFoundException if account is not found', async () => {
      mockAccountsService.findById.mockRejectedValue(
        new ResourceNotFoundException('Account', 'id', 999),
      );

      expect(mockTransactionsRepository.findAllByUserId).not.toHaveBeenCalled();
      await expect(service.findAllByAccountId(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
      await expect(service.findAllByAccountId(999)).rejects.toThrow(
        'Account with id 999 not found.',
      );
      expect(mockAccountsService.findById).toHaveBeenCalledWith(999);
      expect(
        mockTransactionsRepository.findAllByAccountId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAllByUserId', () => {
    it('should return transactions for a given user ID', async () => {
      const expectedTransactions = [mockTransaction, mockTransferTransaction];
      mockUserService.findById.mockResolvedValue(mockUser);
      mockTransactionsRepository.findAllByUserId.mockResolvedValue(
        expectedTransactions,
      );

      const result = await service.findAllByUserId(mockUser.id);
      expect(result).toEqual(expectedTransactions);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockTransactionsRepository.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
        { accountId: undefined },
      );
    });

    it('should return transactions for a given user ID and account ID', async () => {
      const expectedTransactions = [mockTransaction];
      mockUserService.findById.mockResolvedValue(mockUser);
      mockTransactionsRepository.findAllByUserId.mockResolvedValue(
        expectedTransactions,
      );

      const result = await service.findAllByUserId(mockUser.id, mockAccount.id);
      expect(result).toEqual(expectedTransactions);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockTransactionsRepository.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
        { accountId: mockAccount.id },
      );
    });

    it('should throw ResourceNotFoundException if user is not found', async () => {
      mockUserService.findById.mockRejectedValue(
        new ResourceNotFoundException('User', 'id', 999),
      );

      expect(mockTransactionsRepository.findAllByUserId).not.toHaveBeenCalled();
      await expect(service.findAllByUserId(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
      await expect(service.findAllByUserId(999)).rejects.toThrow(
        'User with id 999 not found.',
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(999);
      expect(mockTransactionsRepository.findAllByUserId).not.toHaveBeenCalled();
    });
  });
});
