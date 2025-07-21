export class Account {
  userId: string;
  accountName: string;
  balance: number;
  accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD'; // could be an enum

  constructor(
    userId: string,
    accountName: string,
    balance: number,
    accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD',
  ) {
    this.userId = userId;
    this.accountName = accountName;
    this.balance = balance;
    this.accountType = accountType;
  }
}
