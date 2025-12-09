import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
  @ApiProperty({
    description: 'ID of the expired API key to rollover',
    example: 'FGH2485K6KK79GKG9GKGK',
  })
  @IsString()
  @IsNotEmpty()
  expiredKeyId: string;

  @ApiProperty({
    description:
      'New expiry for the rolled-over API key: 1H=1 Hour, 1D=1 Day, 1M=1 Month, 1Y=1 Year',
    example: '1M',
  })
  @IsString()
  @Matches(/^(1H|1D|1M|1Y)$/, {
    message: 'expiry must be one of 1H, 1D, 1M, 1Y',
  })
  expiry: string;
}
