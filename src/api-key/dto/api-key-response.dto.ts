import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'The raw API key (shown only once)',
    example: 'sk_live_xxxxx',
  })
  apiKey: string;

  @ApiProperty({
    description: 'Expiration datetime of the API key',
    example: '2025-01-01T12:00:00Z',
  })
  expiresAt: Date;
}
