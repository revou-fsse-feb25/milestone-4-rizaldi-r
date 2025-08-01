import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class TransactionResponseDto {
  @Expose()
  public description: string | null;

  @Expose()
  public id: number;

  @Expose()
  public fromAccountId: number | null;

  @Expose()
  public toAccountId: number | null;

  @Expose()
  public amount: Prisma.Decimal;

  @Expose()
  public transactionType: TransactionType;

  @Expose()
  public transactionStatus: TransactionStatus;

  @Expose()
  @Type(() => Date)
  public transactionDate: Date;

  @Expose()
  @Type(() => Date)
  public createdAt: Date;

  @Expose()
  @Type(() => Date)
  public updatedAt: Date;
}
