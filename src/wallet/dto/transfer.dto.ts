import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferDto {
  @IsNotEmpty()
  @IsString()
  @Length(13, 13, { message: 'Wallet number must be exactly 13 digits' })
  wallet_number: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Amount must be greater than 0' })
  amount: number;
}
