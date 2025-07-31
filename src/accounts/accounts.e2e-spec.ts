import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  User,
  UserRole,
  Account,
  Prisma,
  Transaction,
  Currency,
} from '@prisma/client';
import { hashPassword } from '../_common/utils/password-hashing';
import { CreateAccountDto } from './dto/req/create-account.dto';

describe('AccountsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test users
  let adminUser: User;
  let regularUser: User;
  let otherUser: User;

  // Tokens
  let adminUserToken: string;
  let regularUserToken: string;
  let otherUserToken: string;

  // Test accounts
  let regularUserAccount: Account;
  let regularUserAccount2: Account;
  let otherUserAccount: Account;

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
        username: 'admin_e2e_user_accounts',
        email: 'admin_e2e_user_accounts@example.com',
        passwordHash: await hashPassword('AdminPass123!'),
        firstName: 'Admin',
        lastName: 'User',
        userRole: UserRole.ADMIN,
      },
    });

    regularUser = await prisma.user.create({
      data: {
        username: 'regular_e2e_user_accounts',
        email: 'regular_e2e_user_accounts@example.com',
        passwordHash: await hashPassword('RegularPass123!'),
        firstName: 'Regular',
        lastName: 'User',
        userRole: UserRole.CUSTOMER,
      },
    });

    otherUser = await prisma.user.create({
      data: {
        username: 'other_e2e_user_accounts',
        email: 'other_e2e_user_accounts@example.com',
        passwordHash: await hashPassword('OtherPass123!'),
        firstName: 'Other',
        lastName: 'User',
        userRole: UserRole.CUSTOMER,
      },
    });

    // Create accounts for test users
    regularUserAccount = await prisma.account.create({
      data: {
        userId: regularUser.id,
        balance: new Prisma.Decimal(1000),
        accountName: 'Main Account',
        accountNumber: '11111111111111',
      },
    });

    regularUserAccount2 = await prisma.account.create({
      data: {
        userId: regularUser.id,
        balance: new Prisma.Decimal(500),
        accountName: 'Savings Account',
        accountNumber: '22222222222222',
      },
    });

    otherUserAccount = await prisma.account.create({
      data: {
        userId: otherUser.id,
        balance: new Prisma.Decimal(200),
        accountName: 'Other Main Account',
        accountNumber: '33333333333333',
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
    otherUserToken = jwtService.sign({
      id: otherUser.id,
      userRole: otherUser.userRole,
    });
  });

  afterAll(async () => {
    // Clean up database after all tests
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  // --- GET /accounts/all (Admin only) ---
  describe('GET /accounts/all', () => {
    it('should allow an admin to get all accounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/accounts/all')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);
      const responseBody = response.body as Account[];

      expect(responseBody).toBeInstanceOf(Array);
      expect(responseBody.length).toBeGreaterThanOrEqual(3);
    });

    it('should return 403 Forbidden for a regular user', async () => {
      await request(app.getHttpServer())
        .get('/accounts/all')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/accounts/all')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- GET /accounts ---
  describe('GET /accounts', () => {
    it('should allow a user to get their own accounts without transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);
      const responseBody = response.body as Account[];
      expect(responseBody).toBeInstanceOf(Array);
      expect(responseBody.length).toBe(2);
      expect(responseBody[0].userId).toBe(regularUser.id);
      expect(responseBody[0]).not.toHaveProperty('transactions');
    });

    it('should allow a user to get their own accounts with transactions', async () => {
      // Create a dummy transaction for the account
      await prisma.transaction.create({
        data: {
          amount: new Prisma.Decimal(10),
          transactionType: 'DEPOSIT',
          transactionStatus: 'COMPLETED',
          toAccountId: regularUserAccount.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/accounts?transaction=true')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);
      const responseBody = response.body as Account[];

      expect(responseBody).toBeInstanceOf(Array);
      expect(responseBody.length).toBe(2);
      // Check that at least one account has a transactions array

      const accountWithTx = responseBody.find(
        (a) => a.id === regularUserAccount.id,
      ) as Account & { to_transactions: Transaction[] };
      expect(accountWithTx).toBeDefined();
      expect(accountWithTx.to_transactions).toBeInstanceOf(Array);
      expect(accountWithTx.to_transactions.length).toBe(1);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/accounts')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- GET /accounts/:id ---
  describe('GET /accounts/:id', () => {
    it('should allow the account owner to get the account', async () => {
      const response = await request(app.getHttpServer())
        .get(`/accounts/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);
      const responseBody = response.body as Account;

      expect(responseBody.id).toBe(regularUserAccount.id);
    });

    it('should allow an admin to get any account', async () => {
      const response = await request(app.getHttpServer())
        .get(`/accounts/${otherUserAccount.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);
      const responseBody = response.body as Account;

      expect(responseBody.id).toBe(otherUserAccount.id);
    });

    it('should return 403 Forbidden for a non-owner trying to access the account', async () => {
      await request(app.getHttpServer())
        .get(`/accounts/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 Not Found for a non-existent account', async () => {
      await request(app.getHttpServer())
        .get('/accounts/999999')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // --- POST /accounts ---
  describe('POST /accounts', () => {
    it('should allow a user to create a new account', async () => {
      const newAccountData: CreateAccountDto = {
        accountName: 'Vacation Fund',
        currency: Currency.USD,
      };
      const response = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(newAccountData)
        .expect(HttpStatus.CREATED);
      const responseBody = response.body as Account;

      expect(responseBody.userId).toBe(regularUser.id);
      expect(responseBody.accountName).toBe(newAccountData.accountName);
      expect(responseBody.balance).toBe('0');
      expect(responseBody.accountNumber).toBeDefined();

      // Verify in DB
      const accountInDb = await prisma.account.findUnique({
        where: { id: responseBody.id },
      });
      expect(accountInDb).toBeDefined();
    });

    it('should return 409 Conflict if account name already exists for the user', async () => {
      const newAccountData = { accountName: 'Main Account' }; // already exists
      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(newAccountData)
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- PATCH /accounts/:id ---
  describe('PATCH /accounts/:id', () => {
    it('should allow an account owner to update the account name', async () => {
      const newAccountName = 'Updated Main Account';
      const response = await request(app.getHttpServer())
        .patch(`/accounts/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ accountName: newAccountName })
        .expect(HttpStatus.OK);
      const responseBody = response.body as Account;

      expect(responseBody.accountName).toBe(newAccountName);
    });

    it('should return 409 Conflict if updating to an existing account name', async () => {
      const newAccountName = regularUserAccount2.accountName; // 'Savings Account'
      await request(app.getHttpServer())
        .patch(`/accounts/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ accountName: newAccountName })
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 403 Forbidden for a non-owner trying to update the account', async () => {
      await request(app.getHttpServer())
        .patch(`/accounts/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ accountName: 'Hacked Account' })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // --- PATCH /accounts/balance/:id (Admin only) ---
  describe('PATCH /accounts/balance/:id', () => {
    it('should allow an admin to update an account balance', async () => {
      const newBalance = new Prisma.Decimal(5000);
      const response = await request(app.getHttpServer())
        .patch(`/accounts/balance/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ balance: newBalance })
        .expect(HttpStatus.OK);
      const responseBody = response.body as Account;

      expect(new Prisma.Decimal(responseBody.balance)).toStrictEqual(
        newBalance,
      );
    });

    it('should return 403 Forbidden for a regular user', async () => {
      await request(app.getHttpServer())
        .patch(`/accounts/balance/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ balance: 10000 })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // --- DELETE /accounts/:id ---
  describe('DELETE /accounts/:id', () => {
    let emptyAccount: Account;
    beforeEach(async () => {
      // Create a temporary account with zero balance to be deleted
      emptyAccount = await prisma.account.create({
        data: {
          userId: regularUser.id,
          balance: new Prisma.Decimal(0),
          accountName: 'Temp Empty Account',
          accountNumber: '62874103958276541903',
        },
      });
    });

    it('should allow an account owner to delete an account with zero balance', async () => {
      await request(app.getHttpServer())
        .delete(`/accounts/${emptyAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);
      // Verify account is deleted in DB
      const deletedAccount = await prisma.account.findUnique({
        where: { id: emptyAccount.id },
      });
      expect(deletedAccount).toBeNull();
    });

    it('should return 400 Bad Request if trying to delete an account with a non-zero balance', async () => {
      await request(app.getHttpServer())
        .delete(`/accounts/${regularUserAccount.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      // reset
      await prisma.account.delete({
        where: { id: emptyAccount.id },
      });
    });

    it('should return 403 Forbidden for a non-owner trying to delete an account', async () => {
      await request(app.getHttpServer())
        .delete(`/accounts/${emptyAccount.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
