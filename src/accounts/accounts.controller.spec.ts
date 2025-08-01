import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { ResourceOwnershipGuard } from 'src/_common/guards/resource-owner.guard';
import { User, Account, UserRole, Prisma, AccountStatus } from '@prisma/client';
import { CreateAccountDto } from './dto/req/create-account.dto';
import {
  UpdateAccountDto,
  UpdateAccountBalanceDto,
} from './dto/req/update-account.dto';
import { ForbiddenException } from '@nestjs/common';
import { AccountWithTransactionType } from './types/accounts.service.interface';

// Mock the AccountsService
const mockAccountsService = {
  findAll: jest.fn(),
  findAllByUserId: jest.fn(),
  findAllWithTransactionsByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateBalance: jest.fn(),
  delete: jest.fn(),
};

// Mock the guards to simply allow access
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };
const mockResourceOwnershipGuard = { canActivate: jest.fn(() => true) };

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: AccountsService;

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

  // mock admin user
  // const mockAdminUser: User = {
  //   ...mockUser,
  //   id: 99,
  //   username: 'adminuser',
  //   email: 'admin@example.com',
  //   userRole: UserRole.ADMIN,
  // };

  // Define mock account data
  const mockAccount: Account = {
    id: 101,
    userId: mockUser.id,
    accountName: 'Savings',
    accountNumber: '1234567890',
    balance: new Prisma.Decimal(0),
    createdAt: new Date(),
    updatedAt: new Date(),
    currency: 'AUD',
    accountStatus: 'ACTIVE',
  };
  const mockAccount2: Account = {
    id: 102,
    userId: mockUser.id,
    accountName: 'Checking',
    accountNumber: '0987654321',
    balance: new Prisma.Decimal(1200.0),
    createdAt: new Date(),
    updatedAt: new Date(),
    currency: 'AUD',
    accountStatus: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
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
      .compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get<AccountsService>(AccountsService);
  });

  // clear mock after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findAll (Admin only)', () => {
    it('should return all accounts for an admin', async () => {
      const expectedAccounts: Account[] = [mockAccount, mockAccount2];
      mockAccountsService.findAll.mockResolvedValue(expectedAccounts);

      const result = await controller.findAll();
      expect(result).toEqual(expectedAccounts);
      expect(mockAccountsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all accounts for the current user without transaction query', async () => {
      const expectedAccounts: Account[] = [mockAccount, mockAccount2];
      mockAccountsService.findAllByUserId.mockResolvedValue(expectedAccounts);

      const result = await controller.findAllByUserId(mockUser);
      expect(result).toEqual(expectedAccounts);
      expect(mockAccountsService.findAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(
        mockAccountsService.findAllWithTransactionsByUserId,
      ).not.toHaveBeenCalled();
    });

    it('should return accounts with transactions for the current user when transaction query is true', async () => {
      // Mock with transactions
      const expectedAccountsWithTransactions: AccountWithTransactionType[] = [
        { ...mockAccount, from_transactions: [], to_transactions: [] },
      ];
      mockAccountsService.findAllWithTransactionsByUserId.mockResolvedValue(
        expectedAccountsWithTransactions,
      );

      const result = await controller.findAllByUserId(mockUser, true);
      expect(result).toEqual(expectedAccountsWithTransactions);
      expect(
        mockAccountsService.findAllWithTransactionsByUserId,
      ).toHaveBeenCalledWith(mockUser.id);
      expect(mockAccountsService.findAllByUserId).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a single account by ID', async () => {
      mockAccountsService.findById.mockResolvedValue(mockAccount);

      const result = await controller.findById(mockAccount.id);
      expect(result).toEqual(mockAccount);
      expect(mockAccountsService.findById).toHaveBeenCalledWith(mockAccount.id);
    });

    // Handled by the service
    // it('should throw NotFoundException if account not found', async () => {
    //   mockAccountsService.findById.mockResolvedValue(null);

    //   await expect(controller.findById(999)).rejects.toThrow(NotFoundException);
    //   expect(mockAccountsService.findById).toHaveBeenCalledWith(999);
    // });
  });

  describe('create', () => {
    it('should create a new account', async () => {
      const createDto: CreateAccountDto & { accountStatus: AccountStatus } = {
        accountName: 'New Savings',
        currency: 'AUD',
        accountStatus: AccountStatus.ACTIVE,
      };
      const createdAccount: Account = {
        id: 200,
        userId: mockUser.id,
        balance: Prisma.Decimal(0),
        accountNumber: '12345',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockAccountsService.create.mockResolvedValue(createdAccount);

      const result = await controller.create(mockUser, createDto);
      expect(result).toEqual(createdAccount);
      expect(mockAccountsService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
    });
  });

  describe('update', () => {
    it('should update an existing account', async () => {
      const updateDto: UpdateAccountDto = { accountName: 'Updated Savings' };
      const updatedAccount: Account = { ...mockAccount, ...updateDto };
      mockAccountsService.update.mockResolvedValue(updatedAccount);

      const result = await controller.update(mockAccount.id, updateDto);
      expect(result).toEqual(updatedAccount);
      expect(mockAccountsService.update).toHaveBeenCalledWith(
        mockAccount.id,
        updateDto,
      );
    });
  });

  describe('updateBalance (Admin only)', () => {
    it('should update the balance of an account', async () => {
      const updateBalanceDto: UpdateAccountBalanceDto = {
        balance: Prisma.Decimal(1500.0),
      };
      const updatedAccount: Account = {
        ...mockAccount,
        balance: Prisma.Decimal(1500.0),
      };
      mockAccountsService.updateBalance.mockResolvedValue(updatedAccount);

      const result = await controller.updateBalance(
        mockAccount.id,
        updateBalanceDto,
      );
      expect(result).toEqual(updatedAccount);
      expect(mockAccountsService.updateBalance).toHaveBeenCalledWith(
        mockAccount.id,
        updateBalanceDto.balance,
      );
    });
  });

  describe('delete', () => {
    it('should delete an account', async () => {
      mockAccountsService.delete.mockResolvedValue(mockAccount);

      const result = await controller.delete(mockAccount.id);
      expect(result).toEqual(mockAccount);
      expect(mockAccountsService.delete).toHaveBeenCalledWith(mockAccount.id);
    });

    it('should throw BadRequestException if account has balance (handled by service)', async () => {
      mockAccountsService.delete.mockRejectedValue(
        new ForbiddenException('Account balance must be zero before deletion.'),
      );

      await expect(controller.delete(mockAccount.id)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockAccountsService.delete).toHaveBeenCalledWith(mockAccount.id);
    });
  });
});
