import { Prisma } from '@prisma/client';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateAccountDto {
  @IsNotEmpty()
  @IsNumber()
  balance: Prisma.Decimal;
}
