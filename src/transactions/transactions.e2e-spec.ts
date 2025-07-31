import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  User,
  Account,
  UserRole,
  Prisma,
  Transaction,
  TransactionType,
} from '@prisma/client';
import { hashPassword } from '../_common/utils/password-hashing';
import { Response } from 'express';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test users and accounts
  let adminUser: User;
  let regularUser: User;
  let regularUserToken: string;
  let adminUserToken: string;
  let regularUserAccount: Account;
  let regularUserAccount2: Account;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Clean database before starting tests
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        username: 'admin_e2e',
        email: 'admin_e2e@example.com',
        passwordHash: await hashPassword('AdminPass123!'),
        firstName: 'Admin',
        lastName: 'User',
        userRole: UserRole.ADMIN,
      },
    });

    regularUser = await prisma.user.create({
      data: {
        username: 'user_e2e',
        email: 'user_e2e@example.com',
        passwordHash: await hashPassword('UserPass123!'),
        firstName: 'Regular',
        lastName: 'User',
        userRole: UserRole.CUSTOMER,
      },
    });

    // Generate JWT tokens for test users
    adminUserToken = jwtService.sign({
      id: adminUser.id,
      userRole: adminUser.userRole,
    });
    regularUserToken = jwtService.sign({
      id: regularUser.id,
      userRole: regularUser.userRole,
    });

    // Create accounts for the regular user
    regularUserAccount = await prisma.account.create({
      data: {
        userId: regularUser.id,
        accountName: 'Savings E2E',
        accountNumber: 'E2E001',
        balance: new Prisma.Decimal('1000.00'),
      },
    });

    regularUserAccount2 = await prisma.account.create({
      data: {
        userId: regularUser.id,
        accountName: 'Checking E2E',
        accountNumber: 'E2E002',
        balance: new Prisma.Decimal('500.00'),
      },
    });
  });

  afterAll(async () => {
    // Clean up database after all tests
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    // Clear transactions before each test
    await prisma.transaction.deleteMany();
    // Reset account balances to initial state
    await prisma.account.update({
      where: { id: regularUserAccount.id },
      data: { balance: new Prisma.Decimal('1000.00') },
    });
    await prisma.account.update({
      where: { id: regularUserAccount2.id },
      data: { balance: new Prisma.Decimal('500.00') },
    });
  });

  // --- POST /transactions/deposit ---
  describe('POST /transactions/deposit', () => {
    it('should allow a user to deposit funds into their account', async () => {
      const depositAmount = '200';
      const initialBalance = regularUserAccount.balance;
      const description = 'E2E Deposit Test';

      const response = await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id,
          amount: depositAmount,
          description: description,
        })
        .expect(HttpStatus.CREATED);

      const transactionResponse = response.body as Transaction;

      expect(transactionResponse).toBeDefined();
      expect(transactionResponse.toAccountId).toBe(regularUserAccount.id);
      expect(transactionResponse.amount).toBe(depositAmount);
      expect(transactionResponse.description).toBe(description);

      // Verify balance in the database
      const updatedAccount = await prisma.account.findUnique({
        where: { id: regularUserAccount.id },
      });
      if (!updatedAccount) throw new Error('account not found');
      expect(updatedAccount.balance.toString()).toBe(
        new Prisma.Decimal(initialBalance).plus(depositAmount).toString(),
      );

      // Verify transaction record in the database
      const transactionRecord = await prisma.transaction.findFirst({
        where: {
          toAccountId: regularUserAccount.id,
          amount: new Prisma.Decimal(depositAmount),
        },
      });
      expect(transactionRecord).toBeDefined();
    });

    it('should return 400 if accountId is missing for deposit', async () => {
      await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          amount: '100.00',
          description: 'Missing Account ID',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return 403 if user tries to deposit into another user's account", async () => {
      // Create another user and their account
      const anotherUser = await prisma.user.create({
        data: {
          username: 'another_user',
          email: 'another@example.com',
          passwordHash: await hashPassword('AnotherPass123!'),
          firstName: 'Another',
          lastName: 'User',
          userRole: UserRole.CUSTOMER,
        },
      });
      const anotherUserAccount = await prisma.account.create({
        data: {
          userId: anotherUser.id,
          accountName: 'Another Account',
          accountNumber: 'ANOTHER001',
          balance: new Prisma.Decimal('100.00'),
        },
      });

      await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${regularUserToken}`) // Regular user token
        .send({
          accountId: anotherUserAccount.id, // Another user's account
          amount: '50.00',
          description: 'Unauthorized Deposit',
        })
        .expect(HttpStatus.FORBIDDEN);

      // Clean up the created user and account
      await prisma.account.delete({ where: { id: anotherUserAccount.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });

  // --- POST /transactions/withdrawal ---
  describe('POST /transactions/withdrawal', () => {
    it('should allow a user to withdraw funds from their account', async () => {
      const withdrawalAmount = '100';
      const initialBalance = regularUserAccount.balance;
      const description = 'E2E Withdrawal Test';

      const response = await request(app.getHttpServer())
        .post('/transactions/withdrawal')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id,
          amount: withdrawalAmount,
          description: description,
        })
        .expect(HttpStatus.CREATED);

      const transactionResponse = response.body as Transaction;

      expect(transactionResponse).toBeDefined();
      expect(transactionResponse.fromAccountId).toBe(regularUserAccount.id);
      expect(transactionResponse.amount).toBe(withdrawalAmount);
      expect(transactionResponse.description).toBe(description);

      // Verify balance in the database
      const updatedAccount = await prisma.account.findUnique({
        where: { id: regularUserAccount.id },
      });
      if (!updatedAccount) throw new Error('account not found');
      expect(updatedAccount.balance.toString()).toBe(
        new Prisma.Decimal(initialBalance).minus(withdrawalAmount).toString(),
      );
    });

    it('should return 422 for insufficient funds on withdrawal', async () => {
      const largeWithdrawalAmount = '2000.00'; // More than initial 1000

      await request(app.getHttpServer())
        .post('/transactions/withdrawal')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id,
          amount: largeWithdrawalAmount,
          description: 'Insufficient Funds Test',
        })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: 422,
          message: 'Insufficient funds for withdrawal',
          error: 'Unprocessable Entity',
        });
    });
  });

  // --- POST /transactions/transfer ---
  describe('POST /transactions/transfer', () => {
    it('should allow a user to transfer funds between their accounts', async () => {
      const transferAmount = '100';
      const initialFromBalance = regularUserAccount.balance;
      const initialToBalance = regularUserAccount2.balance;
      const description = 'E2E Transfer Test';

      const response = await request(app.getHttpServer())
        .post('/transactions/transfer')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id, // fromAccount
          toAccountId: regularUserAccount2.id,
          amount: transferAmount,
          description: description,
        })
        .expect(HttpStatus.CREATED);

      const transactionResponse = response.body as Transaction;

      expect(transactionResponse).toBeDefined();
      expect(transactionResponse.description).toBe(description);
      expect(transactionResponse.amount).toBe(transferAmount);
      expect(transactionResponse.fromAccountId).toBe(regularUserAccount.id);
      expect(transactionResponse.toAccountId).toBe(regularUserAccount2.id);

      // Verify balances in the database
      const updatedFromAccount = await prisma.account.findUnique({
        where: { id: regularUserAccount.id },
      });
      const updatedToAccount = await prisma.account.findUnique({
        where: { id: regularUserAccount2.id },
      });
      if (!updatedFromAccount || !updatedToAccount)
        throw new Error('account not found');

      expect(updatedFromAccount.balance.toString()).toBe(
        new Prisma.Decimal(initialFromBalance).minus(transferAmount).toString(),
      );
      expect(updatedToAccount.balance.toString()).toBe(
        new Prisma.Decimal(initialToBalance).plus(transferAmount).toString(),
      );
    });

    it('should return 400 if toAccountId is missing for transfer', async () => {
      await request(app.getHttpServer())
        .post('/transactions/transfer')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id,
          amount: '10.00',
          description: 'Missing Recipient',
          // toAccountId is missing
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          statusCode: 400,
          message:
            'Recipient account ID (toAccountId) is required for transfer',
          error: 'Bad Request',
        });
    });

    it('should return 400 if transferring to the same account', async () => {
      await request(app.getHttpServer())
        .post('/transactions/transfer')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id,
          toAccountId: regularUserAccount.id, // Same account
          amount: '10.00',
          description: 'Self Transfer',
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          statusCode: 400,
          message: 'Cannot transfer to the same account',
          error: 'Bad Request',
        });
    });

    it('should return 404 if recipient account not found for transfer', async () => {
      await request(app.getHttpServer())
        .post('/transactions/transfer')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id,
          toAccountId: 99999, // Non-existent account
          amount: '10.00',
          description: 'Non-existent Recipient',
        })
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: 404,
          message: 'Recipient account not found',
          error: 'Not Found',
        });
    });

    it('should return 422 for insufficient funds on transfer', async () => {
      const largeTransferAmount = '2000.00'; // More than regularUserAccount balance

      await request(app.getHttpServer())
        .post('/transactions/transfer')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          accountId: regularUserAccount.id,
          toAccountId: regularUserAccount2.id,
          amount: largeTransferAmount,
          description: 'Insufficient Funds Transfer',
        })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: 422,
          message: 'Insufficient funds for transfer',
          error: 'Unprocessable Entity',
        });
    });
  });

  // --- GET /transactions/all (Admin only) ---
  describe('GET /transactions/all', () => {
    beforeEach(async () => {
      // Create some transactions for testing findAll
      await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal('50.00'),
          transactionType: TransactionType.DEPOSIT,
          description: 'Admin Deposit 1',
          toAccountId: regularUserAccount.id,
          transactionStatus: 'COMPLETED',
        },
      });
      await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal('25.00'),
          transactionType: TransactionType.WITHDRAWAL,
          description: 'Admin Withdrawal 1',
          fromAccountId: regularUserAccount.id,
          transactionStatus: 'COMPLETED',
        },
      });
    });

    it('should allow admin to get all transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/all')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);

      const transactionResponse = response.body as Transaction[];

      expect(transactionResponse).toBeInstanceOf(Array);
      expect(transactionResponse.length).toBeGreaterThanOrEqual(2); // At least the two created
      expect(transactionResponse[0].transactionType).toBeDefined();
    });

    it('should allow admin to get all transactions filtered by accountId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions/all?accountId=${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);

      const transactionResponse = response.body as Transaction[];

      expect(transactionResponse).toBeInstanceOf(Array);
      expect(transactionResponse.length).toBeGreaterThanOrEqual(2); // Both deposit and withdrawal involve this account

      transactionResponse.forEach((transaction: Transaction) => {
        expect(
          transaction.fromAccountId === regularUserAccount.id ||
            transaction.toAccountId === regularUserAccount.id,
        ).toBeTruthy();
      });
    });

    it('should return 403 if non-admin tries to get all transactions', async () => {
      await request(app.getHttpServer())
        .get('/transactions/all')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // --- GET /transactions/:id ---
  describe('GET /transactions/:id', () => {
    let testTransaction: Transaction;
    let otherUserTransaction: Transaction;
    let otherUserAccount: Account;
    let otherUser: User;
    // let otherUserToken: string;

    beforeEach(async () => {
      // Create a transaction for the regular user
      testTransaction = await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal('150.00'),
          transactionType: TransactionType.DEPOSIT,
          description: 'User Specific Test Transaction',
          toAccountId: regularUserAccount.id,
          transactionStatus: 'COMPLETED',
        },
      });

      // Create another user and their transaction for access control tests
      otherUser = await prisma.user.create({
        data: {
          username: 'e2e_other_user',
          email: 'e2e_other@example.com',
          passwordHash: await hashPassword('OtherPass123!'),
          firstName: 'Other',
          lastName: 'User',
          userRole: UserRole.CUSTOMER,
        },
      });
      // otherUserToken = jwtService.sign({
      //   userId: otherUser.id,
      //   userRole: otherUser.userRole,
      // });

      otherUserAccount = await prisma.account.create({
        data: {
          userId: otherUser.id,
          accountName: 'Other User Account',
          accountNumber: 'OTHER007',
          balance: new Prisma.Decimal('200.00'),
        },
      });

      otherUserTransaction = await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal('75.00'),
          transactionType: TransactionType.WITHDRAWAL,
          description: 'Other User Transaction',
          fromAccountId: otherUserAccount.id,
          transactionStatus: 'COMPLETED',
        },
      });
    });

    afterEach(async () => {
      // Clean up other user's data
      // get all accounts for the user
      const accounts = await prisma.transaction.findMany({
        where: { id: otherUser.id },
      });
      const accountIds = accounts.map((account) => account.id);

      await prisma.transaction.deleteMany({
        where: {
          OR: [
            { fromAccountId: { in: accountIds } },
            { toAccountId: { in: accountIds } },
          ],
        },
      });
      await prisma.account.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.deleteMany({ where: { id: otherUser.id } });
    });

    it('should allow admin to get a transaction by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);

      const transactionResponse = response.body as Transaction;

      expect(transactionResponse).toBeDefined();
      expect(transactionResponse.id).toBe(testTransaction.id);
      expect(transactionResponse.description).toBe(testTransaction.description);
    });

    it('should allow the owner to get their transaction by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);

      const transactionResponse = response.body as Transaction;

      expect(transactionResponse).toBeDefined();
      expect(transactionResponse.id).toBe(testTransaction.id);
      expect(transactionResponse.description).toBe(testTransaction.description);
    });

    it("should return 403 if non-owner tries to get another user's transaction by ID", async () => {
      await request(app.getHttpServer())
        .get(`/transactions/${otherUserTransaction.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`) // Regular user token
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 if transaction not found', async () => {
      await request(app.getHttpServer())
        .get('/transactions/999999') // Non-existent ID
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: 404,
          message: 'Transaction with id 999999 not found.',
          error: 'Not Found',
        });
    });
  });

  // --- GET /transactions (by current user) ---
  describe('GET /transactions (by current user)', () => {
    beforeEach(async () => {
      // Ensure regularUserAccount has some transactions
      await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal('100.00'),
          transactionType: TransactionType.DEPOSIT,
          description: 'User E2E Deposit',
          toAccountId: regularUserAccount.id,
          transactionStatus: 'COMPLETED',
        },
      });
      await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal('50.00'),
          transactionType: TransactionType.WITHDRAWAL,
          description: 'User E2E Withdrawal',
          fromAccountId: regularUserAccount.id,
          transactionStatus: 'COMPLETED',
        },
      });
      // Create a transaction for regularUserAccount2
      await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal('20.00'),
          transactionType: TransactionType.DEPOSIT,
          description: 'User E2E Deposit Account 2',
          toAccountId: regularUserAccount2.id,
          transactionStatus: 'COMPLETED',
        },
      });
    });

    // const findAllByUserId = async () => {
    //   const accounts = await prisma.transaction.findMany({
    //     where: { id: regularUser.id },
    //   });
    //   const accountIds = accounts.map((account) => account.id);
    //   await prisma.transaction.findMany({
    //     where: {
    //       OR: [
    //         { fromAccountId: { in: accountIds } },
    //         { toAccountId: { in: accountIds } },
    //       ],
    //     },
    //   });
    // };

    it('should return all transactions for the current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);

      const transactionResponse = response.body as Transaction[];

      expect(transactionResponse).toBeInstanceOf(Array);
      expect(transactionResponse.length).toBeGreaterThanOrEqual(3); // All transactions for regularUser
      transactionResponse.forEach((transaction: Transaction) => {
        const isRelatedToAccount1 =
          transaction.fromAccountId === regularUserAccount.id ||
          transaction.toAccountId === regularUserAccount.id;
        const isRelatedToAccount2 =
          transaction.fromAccountId === regularUserAccount2.id ||
          transaction.toAccountId === regularUserAccount2.id;

        expect(isRelatedToAccount1 || isRelatedToAccount2).toBeTruthy();
      });
    });

    it('should return transactions for the current user filtered by accountId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions?accountId=${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);

      const transactionResponse = response.body as Transaction[];

      expect(transactionResponse).toBeInstanceOf(Array);
      expect(transactionResponse.length).toBe(2); // Only transactions related to regularUserAccount
      transactionResponse.forEach((transaction: Transaction) => {
        expect(
          transaction.fromAccountId === regularUserAccount.id ||
            transaction.toAccountId === regularUserAccount.id,
        ).toBeTruthy();
      });
    });

    it('should return an empty array if no transactions found for the filtered account', async () => {
      // Create a third account for the user with no transactions
      const emptyAccount = await prisma.account.create({
        data: {
          userId: regularUser.id,
          accountName: 'Empty Account',
          accountNumber: 'EMPTY001',
          balance: new Prisma.Decimal('0.00'),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/transactions?accountId=${emptyAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);

      await prisma.account.delete({ where: { id: emptyAccount.id } });
    });

    it("should return an empty array if user tries to filter by another user's accountId", async () => {
      // Create another user and their account
      const anotherUser = await prisma.user.create({
        data: {
          username: 'e2e_another_filter_user',
          email: 'e2e_another_filter@example.com',
          passwordHash: await hashPassword('FilterPass123!'),
          firstName: 'Filter',
          lastName: 'User',
          userRole: UserRole.CUSTOMER,
        },
      });
      const anotherUserAccount = await prisma.account.create({
        data: {
          userId: anotherUser.id,
          accountName: 'Another Filter Account',
          accountNumber: 'FILTER001',
          balance: new Prisma.Decimal('100.00'),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/transactions?accountId=${anotherUserAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);

      const transactionResponse = response.body as Transaction[];

      expect(transactionResponse).toStrictEqual([]);

      // Clean up
      await prisma.account.delete({ where: { id: anotherUserAccount.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });
});
