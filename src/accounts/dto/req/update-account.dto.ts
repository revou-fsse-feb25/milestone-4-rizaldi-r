import { AccountStatus, Prisma } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}

export class UpdateAccountBalanceDto {
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  balance: Prisma.Decimal;
}
