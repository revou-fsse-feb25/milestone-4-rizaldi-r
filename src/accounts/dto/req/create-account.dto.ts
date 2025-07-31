import { AccountStatus, Currency } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
