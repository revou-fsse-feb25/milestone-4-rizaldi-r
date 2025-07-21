import { Expose, Type } from 'class-transformer';

export class AccountBody {
  @Expose()
  // convert into certain type
  @Type(() => String)
  userId: string;

  @Expose()
  @Type(() => String)
  accountName: string;

  @Expose()
  @Type(() => Number)
  balance: number;

  @Expose()
  @Type(() => String)
  accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD'; // could be an enum
}
