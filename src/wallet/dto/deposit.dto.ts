import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    example: 5000,
    description: 'Amount to deposit into wallet (in Naira)',
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
