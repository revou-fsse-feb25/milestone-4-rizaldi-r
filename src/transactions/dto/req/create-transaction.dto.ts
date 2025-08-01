import { Prisma } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Account id is required' })
  @IsNumber()
  accountId: number;

  @IsNotEmpty({ message: 'Amount is required' })
  @Min(0.01, { message: 'Amount must be a positive number.' })
  amount: Prisma.Decimal;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  toAccountId?: number;
}
