import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'Enter payment amount',
    example: 5000,
    type: Number,
  })
  amount: number;
}
