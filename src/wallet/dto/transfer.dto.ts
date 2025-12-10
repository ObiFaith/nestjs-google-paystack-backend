import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, Length } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    example: 'WAL123456',
    description: 'Receiver wallet number',
  })
  @IsString()
  @Length(6, 20)
  wallet_number: string;

  @ApiProperty({
    example: 2000,
    description: 'Amount to transfer',
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
