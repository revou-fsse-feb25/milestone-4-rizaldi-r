import {
  AccountStatus,
  Prisma,
  PrismaClient,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';
import { hashPassword } from '../src/_common/utils/password-hashing';

const prisma = new PrismaClient();

async function clearData() {
  await prisma.transaction.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleared existing data.');
}

async function insertData() {
  console.log('Start seeding...');

  // --- Create Users ---
  const passwordHash1 = await hashPassword('customer123');
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      username: 'john.doe',
      passwordHash: passwordHash1,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userRole: UserRole.CUSTOMER,
    },
  });
  console.log(`Created user with id: ${user1.id} (Customer)`);

  const passwordHash2 = await hashPassword('admin123');
  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      username: 'jane.smith',
      passwordHash: passwordHash2,
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      userRole: UserRole.ADMIN,
    },
  });
  console.log(`Created user with id: ${user2.id} (Admin)`);

  // --- Create Accounts ---
  const account1 = await prisma.account.upsert({
    where: { accountNumber: 'ACC0012345678' },
    update: {},
    create: {
      userId: user1.id,
      accountName: 'john-account',
      accountNumber: 'ACC0012345678',
      balance: new Prisma.Decimal(1500.0),
      currency: 'USD',
      accountStatus: AccountStatus.ACTIVE,
    },
  });
  console.log(
    `Created account with id: ${account1.id} for user ${user1.username}`,
  );

  const account2 = await prisma.account.upsert({
    where: { accountNumber: 'ACC0098765432' },
    update: {},
    create: {
      userId: user2.id,
      accountName: 'jane-account',
      accountNumber: 'ACC0098765432',
      balance: new Prisma.Decimal(500.0),
      currency: 'USD',
      accountStatus: AccountStatus.ACTIVE,
    },
  });
  console.log(
    `Created account with id: ${account2.id} for user ${user2.username}`,
  );

  // --- Create Transactions ---

  // Deposit to account 1
  // Using a fixed ID for upsert here for simplicity in a seeder;
  // in a real application, you'd typically let the database auto-increment
  // or use a more robust unique identifier if upserting.
  const depositTransaction = await prisma.transaction.upsert({
    where: { id: 1 },
    update: {},
    create: {
      toAccountId: account1.id,
      amount: new Prisma.Decimal(500.0),
      transactionType: TransactionType.DEPOSIT,
      transactionStatus: TransactionStatus.COMPLETED,
      description: 'Initial deposit to checking account',
    },
  });
  console.log(`Created deposit transaction with id: ${depositTransaction.id}`);

  // Withdrawal from account 1
  const withdrawalTransaction = await prisma.transaction.upsert({
    where: { id: 2 },
    update: {},
    create: {
      fromAccountId: account1.id,
      amount: new Prisma.Decimal(200.0),
      transactionType: TransactionType.WITHDRAWAL,
      transactionStatus: TransactionStatus.COMPLETED,
      description: 'ATM withdrawal',
    },
  });
  console.log(
    `Created withdrawal transaction with id: ${withdrawalTransaction.id}`,
  );

  // Transfer from account 1 to account 2
  const transferTransaction = await prisma.transaction.upsert({
    where: { id: 3 },
    update: {},
    create: {
      fromAccountId: account1.id,
      toAccountId: account2.id,
      amount: new Prisma.Decimal(300.0),
      transactionType: TransactionType.TRANSFER,
      transactionStatus: TransactionStatus.COMPLETED,
      description: 'Funds transfer to Jane Smith',
    },
  });
  console.log(
    `Created transfer transaction with id: ${transferTransaction.id}`,
  );

  console.log('Seeding finished.');
}

async function main() {
  await clearData();

  await insertData();
}

main()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      console.error('An error occurred during seeding:', e.message);
    } else {
      console.error('An unknown error occurred during seeding:', e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
