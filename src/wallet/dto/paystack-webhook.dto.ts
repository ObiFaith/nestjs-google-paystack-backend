import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsISO8601,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaystackWebhookCustomerDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  email: string;
}

export class PaystackWebhookMetadataDto {
  @ApiProperty({
    example: { referenceType: 'wallet_deposit' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}

export class PaystackWebhookDataDto {
  @ApiProperty({ example: 500000 }) // Paystack uses kobo
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'success' })
  @IsString()
  status: string;

  @ApiProperty({ example: 'PSK_ref_12345' })
  @IsString()
  reference: string;

  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' })
  @IsISO8601()
  paid_at: string;

  @ApiProperty({ type: PaystackWebhookCustomerDto })
  @IsObject()
  customer: PaystackWebhookCustomerDto;

  @ApiProperty({
    type: PaystackWebhookMetadataDto,
    required: false,
  })
  @IsOptional()
  metadata?: PaystackWebhookMetadataDto;
}

export class PaystackWebhookDto {
  @ApiProperty({ example: 'charge.success' })
  @IsString()
  event: string;

  @ApiProperty({ type: PaystackWebhookDataDto })
  @IsObject()
  data: PaystackWebhookDataDto;
}
