# Revobank Backend

## 🚀 Welcome to the Revobank Backend\!

This repository hosts the robust and scalable backend system for **Revobank**, a modern, fictional financial institution dedicated to providing seamless and secure banking services. Built with a focus on reliability and performance, this API powers all core banking operations, including user authentication, account management, and financial transactions.

## ✨ Features

The Revobank Backend provides a comprehensive set of functionalities to manage user accounts and transactions:

- **User Authentication & Authorization:**
  - Secure user registration and login using **passport and bcrypt**.
  - **Role-based access control (RBAC)** using `UserRole` enum for enhanced type safety and clarity.
  - Management of user profiles.
  - **User ownership** guards and custom decorators to ensure data access is restricted to the resource owner.
- **Account Management:**
  - Accurate financial calculations using `Decimal` type for all balance-related operations to prevent floating-point inaccuracies.
- **Transaction Processing:**
  - The Revobank Backend provides a full suite of transaction endpoints to manage user funds. You can **deposit** funds into an account, **withdraw** funds from an account, and **transfer** money between accounts using `POST` requests. 
  - Additionally, you can retrieve a user's transaction history with `GET /transactions` and view the details of a specific transaction with `GET /transactions/:id`.
- **Robustness & Security:**
  - API **throttlers** to prevent misuse and protect against excessive requests.
  - **Custom exception filters** for handling and formatting errors consistently.
- **Data Persistence:**
  - Reliable data storage powered by **PostgreSQL**.
  - Schema management and database interactions handled seamlessly by **Prisma ORM**.
- **Code Quality & Maintainability:**
  - Clean architecture with clear separation of concerns (e.g., **Controller, Service, Repository layers**).
  - A **response transformer interceptor** to ensure successful responses have a consistent format and didn't include password.
  - Comprehensive test coverage for critical components, including **end-to-end (e2e) tests**.

## 🌐 API Endpoints

- Once the application is running, you can view the interactive API documentation provided by Swagger.
Open your browser and navigate to:

  http://localhost:3000/api


- Here's the documentation provided by Postman:

  [https://documenter.getpostman.com/view/46212129/2sB34oDHyh\#51e60be3-f4d4-4219-bfec-81daf1898547](https://documenter.getpostman.com/view/46212129/2sB34oDHyh#51e60be3-f4d4-4219-bfec-81daf1898547)

This table provides a summary of all available API endpoints for the Revobank Backend, categorized for clarity.

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/auth` | `GET` | Check if the current user is authenticated. |
|  | `/auth/login` | `POST` | Log in a user and get an access token. |
|  | `/auth/register` | `POST` | Register a new user account. |
|  | `/auth/refresh` | `POST` | Refresh the current user's authentication token. |
| **User** | `/users` | `GET` | Get all user profiles (admin only). |
|  | `/users/profile` | `GET` | Get the current user's profile. |
|  | `/users/profile` | `PATCH` | Update the current user's profile. |
| **Accounts** | `/accounts/all` | `GET` | Get all accounts in the system (admin only). |
|  | `/accounts` | `GET` | Get accounts for the current user. |
|  | `/accounts/:id` | `GET` | Get a specific account by its ID. |
|  | `/accounts` | `POST` | Create a new account. |
|  | `/accounts/:id` | `PATCH` | Update a specific account by its ID. |
|  | `/accounts/balance/:id` | `PATCH` | Update an account's balance (admin only). |
|  | `/accounts/:id` | `DELETE` | Delete an account by its ID. |
| **Transactions** | `/transactions/deposit` | `POST` | Deposit funds into an account. |
|  | `/transactions/withdrawal` | `POST` | Withdraw funds from an account. |
|  | `/transactions/transfer` | `POST` | Transfer funds between two accounts. |
|  | `/transactions/all` | `GET` | Get all transactions (admin only). |
|  | `/transactions/:id` | `GET` | Get a specific transaction by its ID. |
|  | `/transactions` | `GET` | Get transactions for the current user. |

## 🛠️ Technologies Used

- **NestJS:** A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **Prisma:** A next-generation ORM that makes database access easy and type-safe.
- **PostgreSQL:** A powerful, open-source object-relational database system.
- **TypeScript:** A superset of JavaScript that adds static types, enhancing code quality and developer experience.

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.x or higher)
- **npm**, **Yarn**, or **pnpm**
- **PostgreSQL Client** (e.g., `psql` or a GUI tool like DBeaver/PgAdmin)

## 🚀 Getting Started

Follow these steps to get the Revobank Backend up and running on your local machine.

### 1\. Clone the Repository

```bash
git clone https://github.com/your-username/revobank-backend.git
cd revobank-backend

```

### 2\. Environment Variables

Create a `.env` file in the root of the project based on the `.env.example` file.

```
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/revobank_db?schema=public"
JWT_SECRET="YOUR_SUPER_SECRET_KEY_HERE" # Use a strong, unique key
JWT_EXPIRATION_ACCESS="1d" # e.g., 1h, 7d, 30m
JWT_EXPIRATION_REFRESH="7d"

```

**Important:**

  \* Replace `user`, `password`, and `revobank_db` with your PostgreSQL credentials and desired database name.
  \* Generate a strong `JWT_SECRET` for production environments.

### 3\. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install

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
# or
pnpm run start:dev

```

The application will typically run on `http://localhost:3000`.

## 🧪 Testing

To run the unit and integration tests:

```bash
npm run test
# or
yarn test
# or
pnpm run test

```

To run end-to-end tests:
<font color="gray">* make sure to turn off throttler before testing.</font>
 
```bash
npm run test:e2e
# or
yarn test:e2e
# or
pnpm run test:e2e

```