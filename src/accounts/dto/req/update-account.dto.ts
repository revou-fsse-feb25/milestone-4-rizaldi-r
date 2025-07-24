import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateAccountDto {
  // @IsNotEmpty()
  // @IsString()
  // accountName: string;

  @IsNotEmpty()
  @IsNumber()
  balance: number;
}
