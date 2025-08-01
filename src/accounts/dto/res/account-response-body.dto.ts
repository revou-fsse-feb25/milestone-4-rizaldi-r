import { AccountStatus, Currency, Prisma } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class AccountResponseDto {
  @Expose()
  public id: number;

  @Expose()
  @Type(() => Date)
  public createdAt: Date;

  @Expose()
  @Type(() => Date)
  public updatedAt: Date;

  @Expose()
  public userId: number;

  @Expose()
  public accountName: string;

  @Expose()
  public accountNumber: string;

  @Expose()
  public balance: Prisma.Decimal;

  @Expose()
  public currency: Currency;

  @Expose()
  public accountStatus: AccountStatus;
}

export class AccountWithOptionalFieldsDto extends AccountResponseDto {
  /**
   * An optional field that is only exposed when the theres query
   */
  @Expose({ groups: ['transaction_query'] })
  public from_transaction?: object[];

  @Expose({ groups: ['transaction_query'] })
  public to_transaction?: object[];
}
