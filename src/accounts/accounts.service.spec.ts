import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';
import { UserService } from '../user/user.service';
import { Account, AccountStatus, Currency, Prisma } from '@prisma/client';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ResourceNotFoundException } from '../_common/exceptions/custom-not-found.exception';

// Mock implementations for dependencies
const mockAccountsRepository = {
  findAll: jest.fn(),
  findAllByUserId: jest.fn(),
  findById: jest.fn(),
  findByAccountNumber: jest.fn(),
  findByAccountName: jest.fn(),
  findAllWithTransactionsByUserId: jest.fn(),
  findAccountWithTransactions: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateBalance: jest.fn(),
  delete: jest.fn(),
};

const mockUserService = {
  findById: jest.fn(),
};

describe('AccountsService', () => {
  let service: AccountsService;
  let accountsRepository: AccountsRepository;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: AccountsRepository,
          useValue: mockAccountsRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    accountsRepository = module.get<AccountsRepository>(AccountsRepository);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    // Reset all mocks after each test
    for (const key in mockAccountsRepository) {
      if (Object.prototype.hasOwnProperty.call(mockAccountsRepository, key)) {
        (mockAccountsRepository[key] as jest.Mock).mockReset();
      }
    }
    for (const key in mockUserService) {
      if (Object.prototype.hasOwnProperty.call(mockUserService, key)) {
        (mockUserService[key] as jest.Mock).mockReset();
      }
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userService).toBeDefined();
    expect(accountsRepository).toBeDefined();
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
          balance: new Prisma.Decimal(1000),
          currency: Currency.AUD,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockAccountsRepository.findAll.mockResolvedValue(accounts);

      expect(await service.findAll()).toEqual(accounts);
      expect(mockAccountsRepository.findAll).toHaveBeenCalledTimes(1);
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
        balance: new Prisma.Decimal(1000),
        currency: Currency.AUD,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return an array of accounts for a given user ID', async () => {
      mockUserService.findById.mockResolvedValue({ id: userId });
      mockAccountsRepository.findAllByUserId.mockResolvedValue(accounts);

      expect(await service.findAllByUserId(userId)).toEqual(accounts);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountsRepository.findAllByUserId).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should throw ResourceNotFoundException if user does not exist', async () => {
      mockUserService.findById.mockRejectedValue(
        new ResourceNotFoundException('User', 'id', userId),
      );

      await expect(service.findAllByUserId(userId)).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountsRepository.findAllByUserId).not.toHaveBeenCalled();
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
      balance: new Prisma.Decimal(1000),
      currency: Currency.AUD,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an account if found', async () => {
      mockAccountsRepository.findById.mockResolvedValue(account);

      expect(await service.findById(accountId)).toEqual(account);
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('should throw ResourceNotFoundException if account is not found', async () => {
      mockAccountsRepository.findById.mockResolvedValue(null);

      await expect(service.findById(accountId)).rejects.toThrow(
        new ResourceNotFoundException('Account', 'id', accountId),
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
    });
  });

  describe('findAllWithTransactionsByUserId', () => {
    const userId = 1;
    const accountsWithTransactions: any[] = [
      {
        id: 1,
        accountName: 'Savings',
        transactions: [],
      },
    ];

    it('should return accounts with transactions for a given user ID', async () => {
      mockUserService.findById.mockResolvedValue({ id: userId });
      mockAccountsRepository.findAllWithTransactionsByUserId.mockResolvedValue(
        accountsWithTransactions,
      );

      expect(await service.findAllWithTransactionsByUserId(userId)).toEqual(
        accountsWithTransactions,
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(
        mockAccountsRepository.findAllWithTransactionsByUserId,
      ).toHaveBeenCalledWith(userId);
    });

    it('should throw ResourceNotFoundException if user does not exist', async () => {
      mockUserService.findById.mockRejectedValue(
        new ResourceNotFoundException('User', 'id', userId),
      );

      await expect(
        service.findAllWithTransactionsByUserId(userId),
      ).rejects.toThrow(ResourceNotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(
        mockAccountsRepository.findAllWithTransactionsByUserId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAccountWithTransactions', () => {
    const accountId = 1;
    const accountWithTransactions: any = {
      id: accountId,
      accountName: 'Savings',
      transactions: [],
    };
    const existingAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.AUD,
      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an account with transactions if found', async () => {
      mockAccountsRepository.findById.mockResolvedValue(existingAccount); // For findById check
      mockAccountsRepository.findAccountWithTransactions.mockResolvedValue(
        accountWithTransactions,
      );

      expect(await service.findAccountWithTransactions(accountId)).toEqual(
        accountWithTransactions,
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(
        mockAccountsRepository.findAccountWithTransactions,
      ).toHaveBeenCalledWith(accountId);
    });

    it('should throw ResourceNotFoundException if account is not found', async () => {
      mockAccountsRepository.findById.mockResolvedValue(null);

      await expect(
        service.findAccountWithTransactions(accountId),
      ).rejects.toThrow(ResourceNotFoundException);
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(
        mockAccountsRepository.findAccountWithTransactions,
      ).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const userId = 1;
    const userInput = { accountName: 'New Account', currency: Currency.AUD };
    const createdAccount: Account = {
      id: 1,
      userId: userId,
      accountName: 'New Account',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.AUD,
      balance: new Prisma.Decimal(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully create a new account', async () => {
      mockUserService.findById.mockResolvedValue({ id: userId });
      mockAccountsRepository.findByAccountName.mockResolvedValue(null);
      mockAccountsRepository.findByAccountNumber
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // ensure uniqueness

      mockAccountsRepository.create.mockResolvedValue(createdAccount);

      const result = await service.create(userId, userInput);
      expect(result).toEqual(createdAccount);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountsRepository.findByAccountName).toHaveBeenCalledWith(
        userInput.accountName,
      );
      expect(mockAccountsRepository.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          accountName: userInput.accountName,
          currency: userInput.currency,
          accountNumber: expect.any(String) as string, // accountNumber is generated
          accountStatus: AccountStatus.ACTIVE,
          balance: new Prisma.Decimal(0),
        }),
      );
      // Ensure generateAccountNumber was called and produced a string
      expect(mockAccountsRepository.findByAccountNumber).toHaveBeenCalled();
      expect(result.accountNumber).toMatch(/^\d{14}$/);
    });

    it('should throw ConflictException if account name already exists', async () => {
      mockUserService.findById.mockResolvedValue({ id: userId });
      mockAccountsRepository.findByAccountName.mockResolvedValue({
        id: 2,
        accountName: 'New Account',
      });

      await expect(service.create(userId, userInput)).rejects.toThrow(
        new ConflictException('Account name already exist'),
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountsRepository.findByAccountName).toHaveBeenCalledWith(
        userInput.accountName,
      );
      expect(mockAccountsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ResourceNotFoundException if user does not exist', async () => {
      mockUserService.findById.mockRejectedValue(
        new ResourceNotFoundException('User', 'id', userId),
      );

      await expect(service.create(userId, userInput)).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountsRepository.findByAccountName).not.toHaveBeenCalled();
      expect(mockAccountsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const accountId = 1;
    const updateParam = { accountName: 'Updated Account Name' };
    const updatedAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Updated Account Name',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.AUD,
      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const existingAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Old Account Name',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      balance: new Prisma.Decimal(1000),
      currency: Currency.AUD,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully update an account', async () => {
      mockAccountsRepository.findById.mockResolvedValue(existingAccount);
      mockAccountsRepository.findByAccountName.mockResolvedValue(null); // No conflict
      mockAccountsRepository.update.mockResolvedValue(updatedAccount);

      expect(await service.update(accountId, updateParam)).toEqual(
        updatedAccount,
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.findByAccountName).toHaveBeenCalledWith(
        updateParam.accountName,
      );
      expect(mockAccountsRepository.update).toHaveBeenCalledWith(
        accountId,
        updateParam,
      );
    });

    it('should throw ResourceNotFoundException if account is not found', async () => {
      mockAccountsRepository.findById.mockResolvedValue(null);

      await expect(service.update(accountId, updateParam)).rejects.toThrow(
        new ResourceNotFoundException('Account', 'id', accountId),
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.findByAccountName).not.toHaveBeenCalled();
      expect(mockAccountsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if updated account name already exists', async () => {
      mockAccountsRepository.findById.mockResolvedValue(existingAccount);
      mockAccountsRepository.findByAccountName.mockResolvedValue({
        id: 99,
        accountName: 'Updated Account Name',
      }); // Another account already has this name

      await expect(service.update(accountId, updateParam)).rejects.toThrow(
        new ConflictException('Account name already exist'),
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.findByAccountName).toHaveBeenCalledWith(
        updateParam.accountName,
      );
      expect(mockAccountsRepository.update).not.toHaveBeenCalled();
    });

    it('should update account without checking name if accountName is not provided in updateParam', async () => {
      const partialUpdateParam = { accountStatus: AccountStatus.INACTIVE };
      const updatedAccountStatus: Account = {
        ...existingAccount,
        accountStatus: AccountStatus.INACTIVE,
      };
      mockAccountsRepository.findById.mockResolvedValue(existingAccount);
      mockAccountsRepository.update.mockResolvedValue(updatedAccountStatus);

      expect(await service.update(accountId, partialUpdateParam)).toEqual(
        updatedAccountStatus,
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.findByAccountName).not.toHaveBeenCalled(); // Should not be called
      expect(mockAccountsRepository.update).toHaveBeenCalledWith(
        accountId,
        partialUpdateParam,
      );
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
      currency: Currency.AUD,
      balance: newBalance,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const existingAccount: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.AUD,
      balance: new Prisma.Decimal(1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully update the account balance', async () => {
      mockAccountsRepository.findById.mockResolvedValue(existingAccount);
      mockAccountsRepository.updateBalance.mockResolvedValue(updatedAccount);

      expect(await service.updateBalance(accountId, newBalance)).toEqual(
        updatedAccount,
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        newBalance,
      );
    });

    it('should throw ResourceNotFoundException if account is not found', async () => {
      mockAccountsRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateBalance(accountId, newBalance),
      ).rejects.toThrow(
        new ResourceNotFoundException('Account', 'id', accountId),
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.updateBalance).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const accountId = 1;
    const accountWithZeroBalance: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.AUD,
      balance: new Prisma.Decimal(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const accountWithPositiveBalance: Account = {
      id: accountId,
      userId: 1,
      accountName: 'Savings',
      accountNumber: '12345678901234',
      accountStatus: AccountStatus.ACTIVE,
      currency: Currency.AUD,
      balance: new Prisma.Decimal(100),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const deletedAccount: Account = {
      ...accountWithZeroBalance,
      accountStatus: AccountStatus.INACTIVE, // Assuming delete marks as inactive or truly deletes
    };

    it('should successfully delete an account if balance is zero', async () => {
      mockAccountsRepository.findById.mockResolvedValue(accountWithZeroBalance);
      mockAccountsRepository.delete.mockResolvedValue(deletedAccount);

      expect(await service.delete(accountId)).toEqual(deletedAccount);
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.delete).toHaveBeenCalledWith(accountId);
    });

    it('should throw ResourceNotFoundException if account is not found', async () => {
      mockAccountsRepository.findById.mockResolvedValue(null);

      await expect(service.delete(accountId)).rejects.toThrow(
        new ResourceNotFoundException('Account', 'id', accountId),
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if account balance is not zero', async () => {
      mockAccountsRepository.findById.mockResolvedValue(
        accountWithPositiveBalance,
      );

      await expect(service.delete(accountId)).rejects.toThrow(
        new BadRequestException(
          'Account balance must be zero before deletion.',
        ),
      );
      expect(mockAccountsRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
