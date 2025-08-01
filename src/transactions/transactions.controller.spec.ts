import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { ResourceOwnershipGuard } from 'src/_common/guards/resource-owner.guard';
import { TransactionAccessGuard } from './guards/transaction-account-access.guard';
import { AccountsService } from 'src/accounts/accounts.service';
import { CreateTransactionDto } from './dto/req/create-transaction.dto';
import {
  User,
  TransactionType,
  Account,
  Transaction,
  UserRole,
  Prisma,
  AccountStatus,
  Currency,
} from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

// Mock the TransactionsService
const mockTransactionsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllByAccountId: jest.fn(),
  findById: jest.fn(),
  findAllByUserId: jest.fn(),
};

// Mock the AccountsService
const mockAccountsService = {
  findById: jest.fn(),
};

// Mock the guards
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };
const mockResourceOwnershipGuard = { canActivate: jest.fn(() => true) };
const mockTransactionAccessGuard = { canActivate: jest.fn(() => true) };

// Define mock user data
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

// const mockAdminUser: User = {
//   ...mockUser,
//   id: 99,
//   userRole: UserRole.ADMIN,
// };

// Define mock account data
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

// Define mock transaction data
const mockTransaction: Transaction & {
  fromAccount?: Account | null;
  toAccount?: Account;
} = {
  id: 1,
  amount: new Prisma.Decimal('100'),
  transactionType: TransactionType.DEPOSIT,
  description: 'Deposit',
  fromAccountId: null,
  toAccountId: mockAccount.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  transactionStatus: 'COMPLETED',
  transactionDate: new Date(),
  fromAccount: null,
  toAccount: mockAccount,
};

const mockTransferTransaction: Transaction & {
  fromAccount?: Account;
  toAccount?: Account;
} = {
  id: 2,
  amount: new Prisma.Decimal('50'),
  transactionType: TransactionType.TRANSFER,
  description: 'Transfer',
  fromAccountId: mockAccount.id,
  toAccountId: mockAccount2.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  transactionStatus: 'COMPLETED',
  transactionDate: new Date(),
  fromAccount: mockAccount,
  toAccount: mockAccount2,
};

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: TransactionsService;
  let accountsService: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(ResourceOwnershipGuard)
      .useValue(mockResourceOwnershipGuard)
      .overrideGuard(TransactionAccessGuard)
      .useValue(mockTransactionAccessGuard)
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    accountsService = module.get<AccountsService>(AccountsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(accountsService).toBeDefined();
    expect(transactionsService).toBeDefined();
  });

  describe('createDeposit', () => {
    it('should create a deposit transaction', async () => {
      const createDto: CreateTransactionDto = {
        amount: new Prisma.Decimal(100),
        accountId: mockAccount.id,
        description: 'Salary',
      };
      const expectedTransaction = {
        ...mockTransaction,
        ...createDto,
        type: TransactionType.DEPOSIT,
      };
      mockTransactionsService.create.mockResolvedValue(expectedTransaction);

      const result = await controller.createDeposit(createDto);
      expect(result).toEqual(expectedTransaction);
      expect(mockTransactionsService.create).toHaveBeenCalledWith({
        ...createDto,
        type: TransactionType.DEPOSIT,
      });
    });

    it('should throw an error if service fails to create deposit', async () => {
      const createDto: CreateTransactionDto = {
        amount: Prisma.Decimal(50),
        accountId: mockAccount.id,
        description: 'Failed Deposit',
      };
      mockTransactionsService.create.mockRejectedValue(
        new Error('Failed to save deposit'),
      );

      await expect(controller.createDeposit(createDto)).rejects.toThrow(
        'Failed to save deposit',
      );
      expect(mockTransactionsService.create).toHaveBeenCalledWith({
        ...createDto,
        type: TransactionType.DEPOSIT,
      });
    });
  });

  describe('createWithdrawal', () => {
    it('should create a withdrawal transaction', async () => {
      const createDto: CreateTransactionDto = {
        amount: Prisma.Decimal(50),
        accountId: mockAccount.id,
        description: 'Groceries',
      };
      const expectedTransaction = {
        ...mockTransaction,
        ...createDto,
        type: TransactionType.WITHDRAWAL,
      };
      mockTransactionsService.create.mockResolvedValue(expectedTransaction);

      const result = await controller.createWithdrawal(createDto);
      expect(result).toEqual(expectedTransaction);
      expect(mockTransactionsService.create).toHaveBeenCalledWith({
        ...createDto,
        type: TransactionType.WITHDRAWAL,
      });
    });
  });

  describe('createTransfer', () => {
    it('should create a transfer transaction', async () => {
      const createDto: CreateTransactionDto = {
        amount: Prisma.Decimal(200),
        accountId: mockAccount.id,
        toAccountId: mockAccount2.id,
        description: 'To Checking',
      };
      const expectedTransaction = {
        ...mockTransferTransaction,
        ...createDto,
        type: TransactionType.TRANSFER,
      };
      mockTransactionsService.create.mockResolvedValue(expectedTransaction);

      const result = await controller.createTransfer(createDto);
      expect(result).toEqual(expectedTransaction);
      expect(mockTransactionsService.create).toHaveBeenCalledWith({
        ...createDto,
        type: TransactionType.TRANSFER,
      });
    });
  });

  describe('findAll (Admin)', () => {
    it('should return all transactions for admin without accountId filter', async () => {
      const expectedTransactions = [mockTransaction, mockTransferTransaction];
      mockTransactionsService.findAll.mockResolvedValue(expectedTransactions);

      const result = await controller.findAll();
      expect(result).toEqual(expectedTransactions);
      expect(mockTransactionsService.findAll).toHaveBeenCalledTimes(1);
      expect(mockTransactionsService.findAllByAccountId).not.toHaveBeenCalled();
    });

    it('should return transactions filtered by accountId for admin', async () => {
      const expectedTransactions = [mockTransaction];
      mockTransactionsService.findAllByAccountId.mockResolvedValue(
        expectedTransactions,
      );

      const result = await controller.findAll(mockAccount.id);
      expect(result).toEqual(expectedTransactions);
      expect(mockTransactionsService.findAllByAccountId).toHaveBeenCalledWith(
        mockAccount.id,
      );
      expect(mockTransactionsService.findAll).not.toHaveBeenCalled();
    });

    // Removed test case for ForbiddenException due to RolesGuard
    // it('should throw ForbiddenException if non-admin tries to access (RolesGuard handles)', async () => {
    //   mockRolesGuard.canActivate.mockImplementation(() => {
    //     throw new ForbiddenException('You do not have the required role to access this resource.');
    //   });
    //
    //   await expect(controller.findAll()).rejects.toThrow(ForbiddenException);
    //   expect(mockTransactionsService.findAll).not.toHaveBeenCalled();
    // });
  });

  describe('findById', () => {
    it('should return a single transaction by ID', async () => {
      mockTransactionsService.findById.mockResolvedValue(mockTransaction);

      const result = await controller.findById(mockTransaction.id);
      expect(result).toEqual(mockTransaction);
      expect(mockTransactionsService.findById).toHaveBeenCalledWith(
        mockTransaction.id,
      );
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionsService.findById.mockRejectedValue(
        new NotFoundException('Transaction not found.'),
      );

      await expect(controller.findById(999)).rejects.toThrow(NotFoundException);
      expect(mockTransactionsService.findById).toHaveBeenCalledWith(999);
    });

    // Removed test case for ForbiddenException due to TransactionAccessGuard
    // it('should throw ForbiddenException if user is not authorized (TransactionAccessGuard handles)', async () => {
    //   mockTransactionAccessGuard.canActivate.mockImplementation(() => {
    //     throw new ForbiddenException('You do not have permission to access this transaction.');
    //   });
    //
    //   await expect(controller.findById(mockTransaction.id)).rejects.toThrow(ForbiddenException);
    //   expect(mockTransactionsService.findById).not.toHaveBeenCalled();
    // });
  });

  describe('findAllByCurrentUser', () => {
    it('should return all transactions for the current user without accountId filter', async () => {
      const expectedTransactions = [mockTransaction, mockTransferTransaction];
      mockTransactionsService.findAllByUserId.mockResolvedValue(
        expectedTransactions,
      );

      const result = await controller.findAllByCurrentUser(mockUser);
      expect(result).toEqual(expectedTransactions);
      expect(mockTransactionsService.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockTransactionsService.findAllByUserId).toHaveBeenCalledTimes(1);
    });

    it('should return transactions filtered by accountId for the current user', async () => {
      const expectedTransactions = [mockTransaction];
      mockTransactionsService.findAllByUserId.mockResolvedValue(
        expectedTransactions,
      );

      const result = await controller.findAllByCurrentUser(
        mockUser,
        mockAccount.id,
      );
      expect(result).toEqual(expectedTransactions);
      expect(mockTransactionsService.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
        mockAccount.id,
      );
      expect(mockTransactionsService.findAllByUserId).toHaveBeenCalledTimes(1);
    });

    // Removed test case for ForbiddenException due to JwtAuthGuard
    // it('should throw ForbiddenException if user is not authenticated (JwtAuthGuard handles)', async () => {
    //   mockJwtAuthGuard.canActivate.mockImplementation(() => {
    //     throw new ForbiddenException('Not authenticated.');
    //   });
    //
    //   await expect(controller.findAllByCurrentUser(mockUser)).rejects.toThrow(ForbiddenException);
    //   expect(transactionsService.findAllByUserId).not.toHaveBeenCalled();
    // });
  });
});
