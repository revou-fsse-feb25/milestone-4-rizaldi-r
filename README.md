
-----

# Revobank Backend

## 🚀 Welcome to the Revobank Backend\!

This repository hosts the robust and scalable backend system for **Revobank**, a modern, fictional financial institution dedicated to providing seamless and secure banking services. Built with a focus on reliability and performance, this API powers all core banking operations, including user authentication, account management, and financial transactions.

## ✨ Features

The Revobank Backend provides a comprehensive set of functionalities to manage user accounts and transactions:

  * **User Authentication & Authorization:**
      * Secure user registration and login.
      * Role-based access control (RBAC) using `UserRole` enum for enhanced type safety and clarity.
      * Management of user profiles.
  * **Account Management:**
      * Dedicated `AccountRepository` for abstracting data access and business logic related to accounts.
      * Accurate financial calculations using `Decimal` type for all balance-related operations to prevent floating-point inaccuracies.
  * **Transaction Processing:**
      * **Deposit Funds:** `POST /transactions/deposit`
      * **Withdraw Funds:** `POST /transactions/withdraw`
      * **Transfer Funds:** `POST /transactions/transfer` between accounts.
      * **List Transactions:** `GET /transactions` to view a user's transaction history.
      * **View Transaction Details:** `GET /transactions/:id` for specific transaction information.
  * **Data Persistence:**
      * Reliable data storage powered by **PostgreSQL**.
      * Schema management and database interactions handled seamlessly by **Prisma ORM**.
  * **Code Quality & Maintainability:**
      * Clean architecture with clear separation of concerns (e.g., `UserRepository` in `AuthService`).
      * Refactored and compact code in repositories (e.g., `UserRepository`'s `update` method).
      * Comprehensive test coverage for critical components like the `AuthController`.

## 🛠️ Technologies Used

  * **NestJS:** A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
  * **Prisma:** A next-generation ORM that makes database access easy and type-safe.
  * **PostgreSQL:** A powerful, open-source object-relational database system.
  * **TypeScript:** A superset of JavaScript that adds static types, enhancing code quality and developer experience.

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your system:

  * **Node.js** (v18.x or higher)
  * **npm** or **Yarn** (npm v9.x or higher, Yarn v1.x or higher)
  * **PostgreSQL Client** (e.g., `psql` or a GUI tool like DBeaver/PgAdmin)

## 🚀 Getting Started

Follow these steps to get the Revobank Backend up and running on your local machine.

### 1\. Clone the Repository

```
git clone https://github.com/your-username/revobank-backend.git
cd revobank-backend
```

### 2\. Environment Variables

Create a `.env` file in the root of the project based on the `.env.example` file.

```dotenv
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/revobank_db?schema=public"
JWT_SECRET="YOUR_SUPER_SECRET_KEY_HERE" # Use a strong, unique key
JWT_EXPIRATION_TIME="1h" # e.g., 1h, 7d, 30m
```

**Important:**

  * Replace `user`, `password`, and `revobank_db` with your PostgreSQL credentials and desired database name.
  * Generate a strong `JWT_SECRET` for production environments.



### 3\. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4\. Run Prisma Migrations

Apply the database schema and generate the Prisma client:

```bash
npx prisma migrate dev --name init # Use 'init' or a descriptive name for your first migration
npx prisma generate
```

If you make changes to your Prisma schema (`prisma/schema.prisma`), remember to run `npx prisma migrate dev` again to update your database.

### 5\. Start the Application

```bash
npm run start:dev
# or
yarn start:dev
```

The application will typically run on `http://localhost:3000`.

## 🌐 API Endpoints

Here's the documentation of the main API endpoints provided by the Revobank Backend:

https://documenter.getpostman.com/view/46212129/2sB34oDHyh#51e60be3-f4d4-4219-bfec-81daf1898547

## 🧪 Testing

To run the unit and integration tests:

```bash
npm run test
# or
yarn test
```

To run end-to-end tests:

```bash
npm run test:e2e
# or
yarn test:e2e
```

-----